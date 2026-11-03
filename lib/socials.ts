/** Redes sociales que una tienda puede mostrar en su catálogo. */
export type SocialKey = "instagram" | "facebook" | "tiktok" | "youtube" | "web";
export type Socials = Partial<Record<SocialKey, string>>;

export const SOCIAL_ORDER: SocialKey[] = ["instagram", "facebook", "tiktok", "youtube", "web"];

interface SocialInfo {
  label: string;
  placeholder: string;
  /** Dominios aceptados cuando pegan un link completo. */
  hosts: string[];
  /** Cómo se arma el link si solo escriben el usuario. null = solo links completos. */
  fromHandle: ((h: string) => string) | null;
  handlePattern: RegExp;
}

export const SOCIAL_INFO: Record<SocialKey, SocialInfo> = {
  instagram: { label: "Instagram", placeholder: "@tuusuario", hosts: ["instagram.com"], fromHandle: (h) => `https://www.instagram.com/${h}/`, handlePattern: /^[A-Za-z0-9._]{1,30}$/ },
  facebook: { label: "Facebook", placeholder: "tupagina o link de tu página", hosts: ["facebook.com", "fb.com", "fb.me"], fromHandle: (h) => `https://www.facebook.com/${h}`, handlePattern: /^[A-Za-z0-9.]{3,50}$/ },
  tiktok: { label: "TikTok", placeholder: "@tuusuario", hosts: ["tiktok.com"], fromHandle: (h) => `https://www.tiktok.com/@${h}`, handlePattern: /^[A-Za-z0-9._]{2,24}$/ },
  youtube: { label: "YouTube", placeholder: "@tucanal o link de tu canal", hosts: ["youtube.com", "youtu.be"], fromHandle: (h) => `https://www.youtube.com/@${h}`, handlePattern: /^[A-Za-z0-9._-]{3,30}$/ },
  web: { label: "Sitio web", placeholder: "www.tusitio.com", hosts: [], fromHandle: null, handlePattern: /^$/ },
};

function hostMatches(host: string, allowed: string[]) {
  return allowed.some((h) => host === h || host.endsWith("." + h));
}

/**
 * Convierte lo que escribe la persona (@usuario, usuario o link) en un link https seguro.
 * Devuelve "" si está vacío y null si no es válido para esa red.
 */
export function normalizeSocial(key: SocialKey, raw: string): string | "" | null {
  const info = SOCIAL_INFO[key];
  const v = raw.trim();
  if (!v) return "";
  if (v.length > 200 || /\s/.test(v)) return null;

  const isLink = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v);
  if (!isLink) {
    if (!info.fromHandle) return null;
    const handle = v.replace(/^@/, "");
    return info.handlePattern.test(handle) ? info.fromHandle(handle) : null;
  }

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (info.hosts.length ? !hostMatches(host, info.hosts) : false) return null;
  url.protocol = "https:";
  url.hash = "";
  return url.toString();
}

/** Para mostrar en el formulario: @usuario cuando el link es el estándar de la red. */
export function displaySocial(key: SocialKey, url: string | undefined) {
  if (!url) return "";
  const m = url.match(/^https:\/\/(?:www\.)?(?:instagram\.com\/([A-Za-z0-9._]+)\/?|tiktok\.com\/@([A-Za-z0-9._]+)\/?|youtube\.com\/@([A-Za-z0-9._-]+)\/?)$/);
  if (m && key !== "facebook" && key !== "web") return "@" + (m[1] ?? m[2] ?? m[3]);
  return url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** Deja solo las redes válidas (para guardar y para mostrar). */
export function cleanSocials(input: unknown): Socials {
  const out: Socials = {};
  if (!input || typeof input !== "object") return out;
  for (const key of SOCIAL_ORDER) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v !== "string") continue;
    const n = normalizeSocial(key, v);
    if (n) out[key] = n;
  }
  return out;
}
