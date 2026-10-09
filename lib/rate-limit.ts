import type { NextRequest } from "next/server";

/**
 * Límite de peticiones por ventana, en memoria de la instancia.
 * En serverless cada instancia lleva su propia cuenta: frena ráfagas, no es un límite global exacto.
 */
const hits = new Map<string, number[]>();

export function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
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
