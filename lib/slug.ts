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

/** Para escribir en el campo: acepta guiones (incluido al final mientras se teclea), convierte espacios en guiones y quita lo demás. */
export function slugifyInput(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40);
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
  if (slug.startsWith("-") || slug.endsWith("-")) return "No puede empezar ni terminar con guion.";
  if (!SLUG_PATTERN.test(slug)) return "Solo letras minúsculas, números y guiones.";
  if (RESERVED_SLUGS.has(slug)) return "Ese link está reservado. Prueba otro.";
  return null;
}

const BRAND = "amoxtli";
const STAFF_DOMAIN = "@amoxtli.tech";

/** Dice si un texto menciona la marca aunque lo disfracen con acentos, mayúsculas, espacios o signos («A.moxtli», «AMOXTLI»). */
export function mentionsBrand(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .includes(BRAND);
}

/**
 * Nombres y links que usan la marca están reservados para el equipo (correo @amoxtli.tech), para que nadie se haga pasar por Amoxtli.
 * Solo se aplica al crear o cambiar: las tiendas que ya existen con ese texto siguen funcionando.
 */
export function brandProblem(text: string, email?: string | null): string | null {
  if (email?.toLowerCase().endsWith(STAFF_DOMAIN)) return null;
  return mentionsBrand(text) ? "Ese nombre está reservado. Prueba con otro." : null;
}
