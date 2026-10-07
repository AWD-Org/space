import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/env";
import { adminAuth, hasFirebaseAdmin } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "__session";
export const SESSION_DAYS = 14;

const LOCAL_PREFIX = "local.";

export function encodeLocalSession(user: SessionUser) {
  return LOCAL_PREFIX + Buffer.from(JSON.stringify(user)).toString("base64url");
}

export async function createFirebaseSession(idToken: string) {
  // Solo se aceptan inicios de sesión recientes (menos de 5 minutos).
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) throw new Error("Vuelve a iniciar sesión.");
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

/** Usuario de la sesión actual, o null. Se memoriza por petición. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;

  if (value.startsWith(LOCAL_PREFIX)) {
    if (!isLocalMode) return null;
    try {
      return JSON.parse(Buffer.from(value.slice(LOCAL_PREFIX.length), "base64url").toString()) as SessionUser;
    } catch {
      return null;
    }
  }

  if (!hasFirebaseAdmin) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(value, true);
    return { uid: decoded.uid, email: decoded.email ?? null, name: (decoded.name as string | undefined) ?? null };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");
  return user;
}

/** Para Server Actions: lanza en lugar de redirigir. */
export async function requireUserForAction(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Tu sesión terminó. Vuelve a entrar.");
  return user;
}
