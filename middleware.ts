import { NextResponse, type NextRequest } from "next/server";

/**
 * Solo revisa que exista la cookie de sesión.
 * La verificación real ocurre en el servidor (layout de /app), en runtime Node.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("__session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
