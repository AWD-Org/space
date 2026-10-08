export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** Rutas propias de Space que ninguna tienda puede usar como link. */
export const RESERVED_SLUGS = new Set([
  "app", "api", "entrar", "registro", "login", "signup", "logout", "salir", "empezar", "onboarding",
  "admin", "ayuda", "soporte", "terminos", "privacidad", "precios", "planes", "blog", "u", "p",
  "static", "public", "assets", "images", "img", "media", "_next", "favicon", "robots", "sitemap", "manifest",
  "opengraph-image", "twitter-image", "icon", "apple-icon", "space", "amoxtli", "www", "home", "inicio",
  "recuperar", "cuenta", "tienda", "tiendas", "catalogo", "catalogos", "billing", "pagos",
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export function slugProblem(slug: string): string | null {
  if (slug.length < 3) return "Usa al menos 3 caracteres.";
  if (!SLUG_PATTERN.test(slug)) return "Solo letras minúsculas, números y guiones.";
  if (RESERVED_SLUGS.has(slug)) return "Ese link está reservado. Prueba otro.";
  return null;
}
