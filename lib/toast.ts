"use client";

import { sileo } from "sileo";

/**
 * Avisos de Space (Sileo). Mantiene la forma sencilla `toast.success("mensaje")` y agrega `toast.task`
 * para procesos: muestra un aviso con indicador de carga mientras algo ocurre y lo convierte en éxito o error.
 */
/** Éxito, error y aviso van con el fondo del color del estado y texto blanco, para que se noten; carga e info quedan en blanco. */
const SOLID = {
  success: "#146C3B",
  error: "#B42318",
  warning: "#B45309",
} as const;
const ON_COLOR = { title: "!text-white", description: "!text-white/90", badge: "!bg-white/20 !text-white" };
const solid = (state: keyof typeof SOLID) => ({ fill: SOLID[state], styles: ON_COLOR });

const SHORT = { error: "No se pudo completar", warning: "Revisa esto" } as const;

type Result = { ok: boolean; error?: string };

/** Los avisos cortos van solos; los largos llevan un título breve y el mensaje como descripción. */
const SHORT_LIMIT = 38;
function say(message: string, label: string) {
  return message.length <= SHORT_LIMIT ? { title: message } : { title: label, description: message };
}

export const toast = {
  success: (message: string) => sileo.success({ ...say(message, "Listo"), ...solid("success") }),
  info: (message: string) => sileo.info(say(message, "Aviso")),
  error: (message: string) => sileo.error({ title: SHORT.error, description: message, ...solid("error") }),
  warning: (message: string) => sileo.warning({ title: SHORT.warning, description: message, ...solid("warning") }),
  /** Cierra todos los avisos visibles. */
  dismiss: () => sileo.clear(),

  /**
   * Corre un proceso con aviso de carga. Acepta acciones que devuelven `{ ok, error }` (las de Space)
   * y también promesas que fallan lanzando un Error. Devuelve siempre el resultado, sin lanzar.
   */
  async task<T extends Result>(
    run: () => Promise<T>,
    msgs: { loading: string; success: string | ((r: T) => string); error?: string; showError?: boolean }
  ): Promise<T> {
    const successTitle = (r: T) => (typeof msgs.success === "function" ? msgs.success(r) : msgs.success);
    // Si la pantalla ya muestra el error (por ejemplo dentro de un formulario), solo se avisa el éxito.
    if (msgs.showError === false) {
      const id = sileo.show({ type: "loading", title: msgs.loading, duration: null });
      let r: T;
      try {
        r = await run();
      } catch (e) {
        r = { ok: false, error: e instanceof Error ? e.message : "Inténtalo de nuevo." } as T;
      }
      sileo.dismiss(id);
      if (r.ok) sileo.success({ ...say(successTitle(r), "Listo"), ...solid("success") });
      return r;
    }
    let result: T | undefined;
    const job = run().then((r) => {
      result = r;
      if (!r.ok) throw new Error(r.error || msgs.error || "Inténtalo de nuevo.");
      return r;
    });
    try {
      await sileo.promise(job, {
        loading: { title: msgs.loading },
        success: (r) => ({ ...say(successTitle(r as T), "Listo"), ...solid("success") }),
        error: (e) => ({ title: SHORT.error, description: e instanceof Error ? e.message : msgs.error ?? "Inténtalo de nuevo.", ...solid("error") }),
      });
    } catch {
      /* el aviso de error ya se mostró */
    }
    return result ?? ({ ok: false, error: msgs.error ?? "Inténtalo de nuevo." } as T);
  },
};
