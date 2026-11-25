import "server-only";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { totpSecret } from "@/lib/admin";
import { matchStep } from "./totp";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const STATE = "adminSecurity/state";

type State = { failures?: number; lockedUntil?: number; lastStep?: number };
export type CodeResult = { ok: true } | { ok: false; reason: "bad" | "locked" | "closed"; retryInMin?: number };

/** Registra un evento de acceso o acción en el mismo log que muestra /admin/actividad. */
export async function logAdmin(by: string, action: string, detail: Record<string, unknown> = {}, storeId: string | null = null) {
  try {
    const db = await getDb();
    await db.set(`adminLog/${db.newId()}`, { at: Date.now(), by, storeId, action, detail });
  } catch (e) {
    console.error("[admin log]", e);
  }
}

/** IP de la petición, solo para el registro. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-nf-client-connection-ip") || h.get("x-forwarded-for")?.split(",")[0] || "desconocida").trim().slice(0, 64);
}

/**
 * Valida el código contra el secreto con bloqueo persistido en la base (no en memoria,
 * porque cada instancia serverless tiene la suya) y protección contra repetición:
 * un código ya usado no sirve otra vez aunque siga dentro de su ventana.
 */
export async function checkCode(code: string, who: string): Promise<CodeResult> {
  const secret = totpSecret();
  if (!secret) return { ok: false, reason: "closed" };
  const clean = code.replace(/\s/g, "");
  const db = await getDb();
  const now = Date.now();

  const result = await db.tx<CodeResult>(async (tx) => {
    const s: State = (await tx.get<State>(STATE)) ?? {};
    if ((s.lockedUntil ?? 0) > now) return { ok: false, reason: "locked", retryInMin: Math.ceil(((s.lockedUntil ?? 0) - now) / 60000) };
    const step = matchStep(secret, clean, now);
    if (step === null || step <= (s.lastStep ?? -1)) {
      const failures = (s.failures ?? 0) + 1;
      if (failures >= MAX_FAILS) {
        tx.set(STATE, { failures: 0, lockedUntil: now + LOCK_MS, lastStep: s.lastStep ?? -1 });
        return { ok: false, reason: "locked", retryInMin: Math.ceil(LOCK_MS / 60000) };
      }
      tx.set(STATE, { failures, lockedUntil: 0, lastStep: s.lastStep ?? -1 });
      return { ok: false, reason: "bad" };
    }
    tx.set(STATE, { failures: 0, lockedUntil: 0, lastStep: step });
    return { ok: true };
  });

  const ip = await clientIp();
  if (result.ok) await logAdmin(who, "code_ok", { ip });
  else await logAdmin(who, result.reason === "locked" ? "locked" : "code_failed", { ip });
  return result;
}
