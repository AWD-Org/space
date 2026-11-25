"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBaseAdmin, getVerifiedAdmin, totpSecret } from "@/lib/admin";
import { ADMIN_COOKIE, IDLE_MS, signToken } from "@/lib/admin/token";
import { checkCode, logAdmin } from "@/lib/admin/security";
import type { ActionResult } from "@/lib/types";

const MSG = {
  bad: "Código incorrecto. Revisa tu app e intenta de nuevo.",
  locked: (m?: number) => `Demasiados intentos. Intenta de nuevo en ${m ?? 15} minutos.`,
} as const;

async function setCookie(token: Parameters<typeof signToken>[0]) {
  (await cookies()).set(ADMIN_COOKIE, await signToken(token, totpSecret()!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: Math.floor(IDLE_MS / 1000),
  });
}

/** Paso 2 del acceso: valida el código y abre la sesión de administración. */
export async function verifyAdminCode(code: string): Promise<ActionResult> {
  try {
    const user = await getBaseAdmin();
    if (!user) return { ok: false, error: "No tienes permiso para hacer esto." };
    const r = await checkCode(String(code ?? "").slice(0, 12), user.email!);
    if (!r.ok) return { ok: false, error: r.reason === "locked" ? MSG.locked(r.retryInMin) : r.reason === "closed" ? "Acceso no disponible." : MSG.bad };
    const now = Date.now();
    await setCookie({ u: user.uid, i: now, l: now, f: now });
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[admin verify]", e);
    return { ok: false, error: "No pudimos verificar el código. Intenta de nuevo." };
  }
}

/** Reconfirmación antes de una acción delicada: renueva la marca de "reciente". */
export async function reconfirmAdminCode(code: string): Promise<ActionResult> {
  try {
    const v = await getVerifiedAdmin();
    if (!v) return { ok: false, error: "Tu sesión de administración terminó. Recarga la página." };
    const r = await checkCode(String(code ?? "").slice(0, 12), v.user.email!);
    if (!r.ok) return { ok: false, error: r.reason === "locked" ? MSG.locked(r.retryInMin) : r.reason === "closed" ? "Acceso no disponible." : MSG.bad };
    await setCookie({ ...v.token, l: Date.now(), f: Date.now() });
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[admin reconfirm]", e);
    return { ok: false, error: "No pudimos verificar el código. Intenta de nuevo." };
  }
}

/** Cierra solo la sesión de administración (la cuenta normal sigue abierta). */
export async function adminSignOut() {
  const v = await getVerifiedAdmin();
  if (v) await logAdmin(v.user.email!, "logout");
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/app");
}
