import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { isLocalMode } from "@/lib/env";
import { hasFirebaseAdmin } from "@/lib/firebase/admin";
import { createFirebaseSession, encodeLocalSession, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth/session";

export const runtime = "nodejs";

function withCookie(value: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !isLocalMode,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { idToken?: string; local?: { email?: string; name?: string } };

  if (body.local && isLocalMode) {
    const email = String(body.local.email ?? "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false, error: "Correo no válido." }, { status: 400 });
    const uid = "local_" + crypto.createHash("sha1").update(email).digest("hex").slice(0, 20);
    return withCookie(encodeLocalSession({ uid, email, name: body.local.name?.trim() || null }));
  }

  if (!hasFirebaseAdmin) {
    return NextResponse.json({ ok: false, error: "Space todavía no está conectado a su sistema de cuentas." }, { status: 503 });
  }
  if (!body.idToken) return NextResponse.json({ ok: false, error: "Falta el token." }, { status: 400 });
  try {
    return withCookie(await createFirebaseSession(body.idToken));
  } catch {
    return NextResponse.json({ ok: false, error: "No pudimos iniciar tu sesión. Intenta de nuevo." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
