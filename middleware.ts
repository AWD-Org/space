import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, IDLE_MS, isLive, readToken, signToken } from "@/lib/admin/token";

/**
 * /app: solo revisa que exista la cookie de sesión (la verificación real ocurre en el servidor).
 * /admin: sin sesión base responde 404 (como cualquier ruta inexistente), nunca se cachea ni se indexa,
 * y mientras la sesión de administración esté viva se renueva su ventana de inactividad.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!req.cookies.get("__session")?.value) {
      return harden(NextResponse.rewrite(new URL("/_x/_y/_z", req.url), { status: 404 }));
    }
    const res = harden(NextResponse.next());
    const secret = (process.env.ADMIN_TOTP_SECRET ?? "").trim();
    const token = secret.length >= 16 ? await readToken(req.cookies.get(ADMIN_COOKIE)?.value, secret) : null;
    // Las Server Actions pueden poner su propia cookie (login, reconfirmación): no se pisa. La ventana se renueva en la siguiente navegación.
    if (token && isLive(token) && !req.headers.has("next-action")) {
      res.cookies.set(ADMIN_COOKIE, await signToken({ ...token, l: Date.now() }, secret), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/admin",
        maxAge: Math.floor(IDLE_MS / 1000),
      });
    }
    return res;
  }

  if (!req.cookies.get("__session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

function harden(res: NextResponse) {
  res.headers.set("Cache-Control", "private, no-store, max-age=0");
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = { matcher: ["/app/:path*", "/admin", "/admin/:path*"] };
