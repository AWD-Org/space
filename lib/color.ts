/** Utilidades de color para el acento de cada tienda. */

export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toUpperCase()}` : null;
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste del color contra texto blanco (1 a 21). */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/**
 * El catálogo pone texto blanco sobre el color de la tienda (botones, logo, bolsa).
 * Si el color es tan claro que no se lee, lo oscurece lo mínimo necesario.
 */
export function ensureReadable(hex: string, min = 4.5): { hex: string; adjusted: boolean } {
  const base = normalizeHex(hex) ?? "#3B55E6";
  if (contrastWithWhite(base) >= min) return { hex: base, adjusted: false };
  let [r, g, b] = toRgb(base);
  for (let i = 0; i < 60 && contrastWithWhite(toHex([r, g, b])) < min; i++) {
    r *= 0.96;
    g *= 0.96;
    b *= 0.96;
  }
  return { hex: toHex([r, g, b]), adjusted: true };
}
