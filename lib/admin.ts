import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { ADMIN_COOKIE, isFresh, isLive, readToken, type AdminToken } from "@/lib/admin/token";
import { getDb } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

/** Documento donde se anota el último cierre de admin: los tokens emitidos antes de esa hora ya no sirven. */
export const ADMIN_SESSION_DOC = "adminSecurity/session";

/** Texto del error que el cliente usa para pedir el código otra vez antes de una acción delicada. */
export const REAUTH = "REAUTH_REQUIRED";

/**
 * Correos con acceso a /admin: SOLO los de SUPERADMIN_EMAILS (separados por coma).
 * Sin la variable no entra nadie (falla cerrado): no hay lista por defecto.
 */
export function superAdminEmails(): string[] {
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Secreto TOTP (base32). Sin él, el admin queda cerrado para todos. */
export function totpSecret(): string | null {
  const s = (process.env.ADMIN_TOTP_SECRET ?? "").trim();
  return s.length >= 16 ? s : null;
}

/** Primer filtro: sesión base válida, correo verificado y en la lista. Aún falta el código 2FA. */
export const getBaseAdmin = cache(async (): Promise<SessionUser | null> => {
  if (!totpSecret()) return null;
  const user = await getSessionUser();
  if (!user?.email || user.emailVerified !== true) return null;
  return superAdminEmails().includes(user.email.toLowerCase()) ? user : null;
});

type Verified = { user: SessionUser; token: AdminToken };

/** Segundo filtro: además trae una cookie `__admin` firmada, vigente y atada a este usuario. */
export const getVerifiedAdmin = cache(async (): Promise<Verified | null> => {
  const user = await getBaseAdmin();
  if (!user) return null;
  const token = await readToken((await cookies()).get(ADMIN_COOKIE)?.value, totpSecret()!);
  if (!token || token.u !== user.uid || !isLive(token)) return null;
  const db = await getDb();
  const rev = await db.get<{ revokedBefore?: number }>(ADMIN_SESSION_DOC);
  if (rev?.revokedBefore && token.i <= rev.revokedBefore) return null;
  return { user, token };
});

/** Superadmin completo (sesión + 2FA). */
export async function getAdmin(): Promise<SessionUser | null> {
  return (await getVerifiedAdmin())?.user ?? null;
}

/**
 * Para páginas. Quien no está en la lista ve un 404 idéntico al de cualquier ruta inexistente.
 * Quien sí está, pero no ha puesto su código, va a la verificación.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const v = await getVerifiedAdmin();
  if (v) return v.user;
  if (await getBaseAdmin()) redirect("/admin/verificar");
  notFound();
}

/** Para Server Actions. Con `fresh` exige haber confirmado el código hace menos de 5 minutos. */
export async function requireAdminForAction(opts: { fresh?: boolean } = {}): Promise<SessionUser> {
  const v = await getVerifiedAdmin();
  if (!v) throw new Error("No tienes permiso para hacer esto.");
  if (opts.fresh && !isFresh(v.token)) throw new Error(REAUTH);
  return v.user;
}
