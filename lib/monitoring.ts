import "server-only";

/**
 * Reporte de errores a Sentry sin SDK (cero peso en el cliente y sin tocar la configuración de Next).
 * Se activa solo si existe SENTRY_DSN; sin él, todo es un no-op.
 * Envía únicamente mensaje, pila, ruta (sin query string) y entorno. Nunca cookies, cabeceras ni cuerpos.
 */

type Dsn = { endpoint: string; key: string; raw: string };

function parseDsn(raw: string | undefined): Dsn | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const project = u.pathname.replace(/^\/+/, "");
    if (!u.username || !project) return null;
    return { endpoint: `${u.protocol}//${u.host}/api/${project}/envelope/`, key: u.username, raw };
  } catch {
    return null;
  }
}

export const monitoringEnabled = () => parseDsn(process.env.SENTRY_DSN) !== null;

const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);
const cleanPath = (p: unknown) => clip(p, 300).split("?")[0].split("#")[0];

export type ErrorReport = {
  message: string;
  stack?: string;
  source: "server" | "client";
  path?: string;
  digest?: string;
};

export async function reportError(r: ErrorReport): Promise<void> {
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment: process.env.SENTRY_ENVIRONMENT || process.env.CONTEXT || process.env.NODE_ENV || "production",
    release: process.env.COMMIT_REF || undefined,
    tags: { source: r.source, digest: r.digest },
    request: r.path ? { url: cleanPath(r.path) } : undefined,
    exception: { values: [{ type: "Error", value: clip(r.message, 500) }] },
    extra: r.stack ? { stack: clip(r.stack, 4000) } : undefined,
  };
  const body = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: dsn.raw }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
  try {
    await fetch(dsn.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=space-lite/1`,
      },
      body,
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* el monitoreo nunca debe tumbar una petición */
  }
}
