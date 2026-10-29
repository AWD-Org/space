import crypto from "node:crypto";
import type { SessionUser } from "@/lib/types";

/**
 * Validación de la cookie de sesión.
 *
 * 1. La firma y la vigencia se revisan en local (sin red): es lo que decide si hay sesión.
 * 2. La revocación (cuenta borrada, desactivada o sesiones cerradas) sí consulta a Firebase, pero con tope de
 *    tiempo y memorizada por unos minutos: una consulta lenta o caída nunca saca a la persona de su panel.
 * 3. «Correo verificado» solo se consulta si la cookie dice que no lo está, también memorizado y con tope.
 */

export interface DecodedSession {
  uid: string;
  email?: string;
  name?: unknown;
  email_verified?: boolean;
}

export interface AdminAuthLike {
  verifySessionCookie(cookie: string, checkRevoked?: boolean): Promise<DecodedSession>;
  getUser(uid: string): Promise<{ emailVerified: boolean }>;
}

export const REVOCATION_TTL_MS = 5 * 60_000;
export const FAILED_CHECK_TTL_MS = 30_000;
export const VERIFIED_TTL_MS = 60_000;
export const NETWORK_TIMEOUT_MS = 1_500;

/** Códigos de Firebase que significan «esta sesión ya no sirve» (no un fallo de red). */
const DEFINITIVE = new Set([
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
  "auth/invalid-session-cookie",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
]);

const revocationOk = new Map<string, number>();
const verifiedCache = new Map<string, { value: boolean; until: number }>();

class TimeoutError extends Error {
  code = "space/timeout";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

const codeOf = (e: unknown) => (e as { code?: string })?.code ?? "";
const keyOf = (cookie: string) => crypto.createHash("sha256").update(cookie).digest("base64url");

function prune(now: number) {
  if (revocationOk.size > 2000) for (const [k, until] of revocationOk) if (until < now) revocationOk.delete(k);
  if (verifiedCache.size > 2000) for (const [k, v] of verifiedCache) if (v.until < now) verifiedCache.delete(k);
}

/** Solo para pruebas. */
export function resetSessionCaches() {
  revocationOk.clear();
  verifiedCache.clear();
}

export async function verifySession(auth: AdminAuthLike, cookie: string, now: () => number = Date.now): Promise<SessionUser | null> {
  // 1) Firma y vigencia, en local. Un fallo que no sea definitivo (p. ej. no pudo bajar las llaves públicas) se reintenta una vez.
  let decoded: DecodedSession;
  try {
    decoded = await auth.verifySessionCookie(cookie, false);
  } catch (e) {
    if (DEFINITIVE.has(codeOf(e))) return null;
    try {
      decoded = await withTimeout(auth.verifySessionCookie(cookie, false), NETWORK_TIMEOUT_MS);
    } catch {
      return null;
    }
  }

  // 2) Revocación: memorizada, con tope de tiempo y a favor de la persona si Firebase no contesta.
  const key = keyOf(cookie);
  const t0 = now();
  if ((revocationOk.get(key) ?? 0) <= t0) {
    try {
      await withTimeout(auth.verifySessionCookie(cookie, true), NETWORK_TIMEOUT_MS);
      revocationOk.set(key, t0 + REVOCATION_TTL_MS);
    } catch (e) {
      if (DEFINITIVE.has(codeOf(e))) {
        revocationOk.delete(key);
        return null;
      }
      // Lenta o caída: la firma ya es válida, se deja pasar y no se vuelve a insistir por un rato.
      revocationOk.set(key, t0 + FAILED_CHECK_TTL_MS);
    }
    prune(t0);
  }

  // 3) Correo verificado: la cookie guarda el estado del momento en que entró; si ya confirmó, se lee al día.
  let emailVerified = decoded.email_verified === true;
  if (!emailVerified) {
    const cached = verifiedCache.get(decoded.uid);
    if (cached && cached.until > t0) emailVerified = cached.value;
    else {
      try {
        emailVerified = (await withTimeout(auth.getUser(decoded.uid), NETWORK_TIMEOUT_MS)).emailVerified;
        verifiedCache.set(decoded.uid, { value: emailVerified, until: t0 + VERIFIED_TTL_MS });
      } catch {
        verifiedCache.set(decoded.uid, { value: false, until: t0 + FAILED_CHECK_TTL_MS });
      }
    }
  }

  return { uid: decoded.uid, email: decoded.email ?? null, name: (decoded.name as string | undefined) ?? null, emailVerified };
}
