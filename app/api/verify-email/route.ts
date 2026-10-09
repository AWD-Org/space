import { NextResponse } from "next/server";
import { isLocalMode, SITE_URL } from "@/lib/env";
import { hasFirebaseAdmin } from "@/lib/firebase/config";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimited } from "@/lib/rate-limit";
import { resendConfigured, sendVerificationEmail } from "@/lib/email/verify-email";

export const runtime = "nodejs";

/** Manda (o reenvía) el correo de confirmación a la persona con sesión. Cuentas de Google ya vienen verificadas. */
export async function POST() {
  const user = await getSessionUser();
  if (!user || !user.email) return NextResponse.json({ ok: false, error: "Entra a tu cuenta primero." }, { status: 401 });
  if (isLocalMode || !hasFirebaseAdmin || user.emailVerified) return NextResponse.json({ ok: true, already: true });
  if (rateLimited(`verify:${user.uid}`, 3, 60 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Ya te mandamos varios correos. Espera un rato e intenta de nuevo." }, { status: 429 });
  }
  if (!resendConfigured()) return NextResponse.json({ ok: false, error: "El envío de correos todavía no está configurado." }, { status: 503 });
  try {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const link = await adminAuth().generateEmailVerificationLink(user.email, { url: `${SITE_URL}/app` });
    await sendVerificationEmail(user.email, user.name, link);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify-email]", e);
    return NextResponse.json({ ok: false, error: "No pudimos mandar el correo. Intenta de nuevo en un momento." }, { status: 502 });
  }
}
