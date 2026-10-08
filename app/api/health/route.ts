import { NextResponse } from "next/server";
import { adminAuth, adminDb, hasFirebaseAdmin, privateKeyLooksValid } from "@/lib/firebase/admin";
import { hasFirebaseClient, isLocalMode } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function brief(e: unknown) {
  const err = e as { code?: string | number; message?: string };
  return `error ${err.code ?? ""}: ${String(err.message ?? e).split("\n")[0].slice(0, 160)}`;
}

/** Diagnóstico de la conexión con Firebase. No muestra ningún valor secreto. */
export async function GET() {
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
    try {
      await adminDb().doc("config/ping").get();
      out.firestore = "ok";
    } catch (e) {
      out.firestore = brief(e);
    }
    try {
      await adminAuth().listUsers(1);
      out.auth = "ok";
    } catch (e) {
      out.auth = brief(e);
    }
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
