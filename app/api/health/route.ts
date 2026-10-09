import { NextResponse, type NextRequest } from "next/server";
import { hasFirebaseAdmin, privateKeyLooksValid } from "@/lib/firebase/config";
import { hasFirebaseClient, isLocalMode } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function brief(e: unknown) {
  const err = e as { code?: string | number; message?: string };
  return `error ${err.code ?? ""}: ${String(err.message ?? e).split("\n")[0].slice(0, 200)}`;
}

/** Diagnóstico de la conexión con Firebase. No muestra ningún valor secreto. */
export async function GET(req: NextRequest) {
  // En producción el detalle solo se entrega con ?token=<HEALTH_TOKEN>; sin token solo se informa que el servicio responde.
  const token = process.env.HEALTH_TOKEN;
  if (process.env.NODE_ENV === "production" && !(token && req.nextUrl.searchParams.get("token") === token)) {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }
  const out: Record<string, unknown> = {
    node: process.version,
    localMode: isLocalMode,
    clientConfig: hasFirebaseClient,
    adminEnv: {
      projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      privateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyFormat: hasFirebaseAdmin ? privateKeyLooksValid() : null,
    },
  };
  if (!isLocalMode && hasFirebaseAdmin) {
    let admin: typeof import("@/lib/firebase/admin") | null = null;
    try {
      admin = await import("@/lib/firebase/admin");
      out.sdk = "ok";
    } catch (e) {
      out.sdk = brief(e);
    }
    if (admin) {
      try {
        await admin.adminDb().doc("config/ping").get();
        out.firestore = "ok";
      } catch (e) {
        out.firestore = brief(e);
      }
      try {
        await admin.adminAuth().listUsers(1);
        out.auth = "ok";
      } catch (e) {
        out.auth = brief(e);
      }
    }
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
