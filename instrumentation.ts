import type { Instrumentation } from "next";

/** Errores de servidor (render, rutas, acciones) hacia Sentry; no hace nada sin SENTRY_DSN. */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("@/lib/monitoring");
  const e = err as Error & { digest?: string };
  await reportError({ message: e?.message || String(err), stack: e?.stack, source: "server", path: request.path, digest: e?.digest });
};
