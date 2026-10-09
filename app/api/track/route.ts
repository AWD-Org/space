import { NextResponse, type NextRequest } from "next/server";
import { backendReady, getDb, increment } from "@/lib/db";
import { statsPath } from "@/lib/data/queries";
import { todayKey } from "@/lib/format";
import { clientIp, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ID = /^[A-Za-z0-9_-]{6,64}$/;

/** Contadores diarios: visitas, vistas de producto y pedidos enviados. */
export async function POST(req: NextRequest) {
  if (!backendReady()) return new NextResponse(null, { status: 204 });
  const ip = clientIp(req);
  if (rateLimited(`track:${ip}`, 30, 60_000)) return new NextResponse(null, { status: 429 });
  const body = (await req.json().catch(() => null)) as { storeId?: string; kind?: string; productId?: string } | null;
  if (!body?.storeId || !ID.test(body.storeId)) return new NextResponse(null, { status: 204 });

  const date = todayKey();
  const data: Record<string, unknown> = { date };
  if (body.kind === "view") data.views = increment(1);
  else if (body.kind === "order") {
    // Un comprador real manda pocos pedidos por minuto a una misma tienda.
    if (rateLimited(`order:${ip}:${body.storeId}`, 5, 60_000)) return new NextResponse(null, { status: 429 });
    data.ordersSent = increment(1);
  }
  else if (body.kind === "product" && body.productId && ID.test(body.productId)) data[`productViews.${body.productId}`] = increment(1);
  else return new NextResponse(null, { status: 204 });

  try {
    const db = await getDb();
    if (!(await db.get(`stores/${body.storeId}`))) return new NextResponse(null, { status: 204 });
    await db.set(`${statsPath(body.storeId)}/${date}`, data, { merge: true });
  } catch (err) {
    console.error("[track]", err);
  }
  return new NextResponse(null, { status: 204 });
}
