import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { monitoringEnabled, reportError } from "@/lib/monitoring";

export const runtime = "nodejs";

/** Errores del navegador. Pasan por aquí para no exponer el DSN ni cargar el SDK en el cliente. */
export async function POST(req: NextRequest) {
  if (!monitoringEnabled()) return new NextResponse(null, { status: 204 });
  if (rateLimited(`cerr:${clientIp(req)}`, 10, 60_000)) return new NextResponse(null, { status: 429 });
  const raw = await req.text();
  if (raw.length > 8_000) return new NextResponse(null, { status: 413 });
  let body: { message?: unknown; stack?: unknown; path?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body || typeof body.message !== "string" || !body.message) return new NextResponse(null, { status: 400 });
  await reportError({
    message: body.message,
    stack: typeof body.stack === "string" ? body.stack : undefined,
    path: typeof body.path === "string" ? body.path : undefined,
    source: "client",
  });
  return new NextResponse(null, { status: 204 });
}
