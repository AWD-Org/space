import type { ActionResult } from "@/lib/types";

/**
 * Ejecuta una acción del servidor sin dejar nunca un fallo en silencio.
 * Sin internet → mensaje claro. Sesión vencida → lleva a /entrar y regresa a la misma pantalla.
 */
export async function safe<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { ok: false, error: "Sin conexión. Revisa tu internet e intenta de nuevo." };
    }
    try {
      const probe = await fetch("/app", { cache: "no-store", redirect: "manual" });
      if (probe.type === "opaqueredirect" || probe.status === 401 || probe.status === 403) {
        const next = encodeURIComponent(window.location.pathname);
        window.setTimeout(() => window.location.assign(`/entrar?next=${next}`), 1200);
        return { ok: false, error: "Tu sesión terminó. Te llevamos a entrar de nuevo." };
      }
    } catch {
      return { ok: false, error: "Sin conexión. Revisa tu internet e intenta de nuevo." };
    }
    return { ok: false, error: "No pudimos completar la acción. Intenta de nuevo." };
  }
}
