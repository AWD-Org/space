import "server-only";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

/** Superadmins por defecto. */
const DEFAULT_ADMINS = "awd@amoxtli.tech,arturo.awdtech@gmail.com";

/** Correos con acceso a /admin. Si existe SUPERADMIN_EMAILS (separados por coma), sustituye a la lista por defecto. */
export function superAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS || DEFAULT_ADMINS)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Superadmin solo si la sesión es válida, el correo está verificado y está en la lista. */
export async function getAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user?.email || user.emailVerified !== true) return null;
  return superAdminEmails().includes(user.email.toLowerCase()) ? user : null;
}

/** Para páginas: cualquiera que no sea superadmin ve un 404, sin pistas de que la ruta existe. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getAdmin();
  if (!user) notFound();
  return user;
}

/** Para Server Actions. */
export async function requireAdminForAction(): Promise<SessionUser> {
  const user = await getAdmin();
  if (!user) throw new Error("No tienes permiso para hacer esto.");
  return user;
}
