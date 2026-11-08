import type { NextRequest } from "next/server";

/**
 * Límite de peticiones por ventana, en memoria de la instancia.
 * En serverless cada instancia lleva su propia cuenta: frena ráfagas, no es un límite global exacto.
 */
const hits = new Map<string, number[]>();

/** Huella sin IP (agente + idioma) para cuando la plataforma no entrega ninguna: evita que todos compartan una sola cubeta. */
function fingerprint(req: NextRequest) {
  const raw = `${req.headers.get("user-agent") ?? ""}|${req.headers.get("accept-language") ?? ""}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return `anon:${(h >>> 0).toString(36)}`;
}

/**
 * IP del cliente. Se prefieren las cabeceras que pone la plataforma (Netlify, Vercel) porque el cliente no puede falsearlas.
 * `x-forwarded-for` se lee de derecha a izquierda: la entrada de la derecha la agregó el proxy más cercano; la de la izquierda
 * la manda el cliente y es falsificable.
 */
export function clientIp(req: NextRequest) {
  const trusted = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-real-ip");
  if (trusted) return trusted.split(",")[0]!.trim();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").map((x) => x.trim()).filter(Boolean);
  if (forwarded?.length) return forwarded[forwarded.length - 1]!;
  return fingerprint(req);
}

/** true si la clave ya superó `max` peticiones en los últimos `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}
