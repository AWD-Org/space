import type { OptionValue, Product, ProductOption } from "./types";

/** Lee opciones guardadas: acepta el formato anterior (valores como texto) y el nuevo (objetos). */
export function normalizeOptions(raw: unknown): ProductOption[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductOption[] = [];
  for (const o of raw) {
    if (!o || typeof o !== "object" || typeof (o as ProductOption).name !== "string" || !Array.isArray((o as ProductOption).values)) continue;
    const values: OptionValue[] = [];
    for (const v of (o as { values: unknown[] }).values) {
      if (typeof v === "string") {
        if (v.trim()) values.push({ label: v });
      } else if (v && typeof v === "object" && typeof (v as OptionValue).label === "string" && (v as OptionValue).label.trim()) {
        const x = v as OptionValue;
        values.push({ label: x.label, ...(x.extra && x.extra > 0 ? { extra: x.extra } : {}), ...(x.soldOut ? { soldOut: true } : {}) });
      }
    }
    if (values.length) out.push({ name: (o as ProductOption).name, values });
  }
  return out;
}

/** Producto con las opciones en formato actual. */
export function withOptions<T extends { options?: unknown }>(p: T): T & { options: ProductOption[] } {
  return { ...p, options: normalizeOptions(p.options) };
}

export const hasOptions = (p: Pick<Product, "options">) => (p.options ?? []).length > 0;

/** ¿Algún valor suma al precio? Entonces el precio se muestra «Desde». */
export function hasPriceExtras(p: Pick<Product, "options" | "price">) {
  return p.price != null && (p.options ?? []).some((o) => o.values.some((v) => (v.extra ?? 0) > 0));
}

/** Si todos los valores de una opción están agotados, el producto no se puede pedir. */
export function optionsBlocked(p: Pick<Product, "options">) {
  return (p.options ?? []).some((o) => o.values.length > 0 && o.values.every((v) => v.soldOut));
}

export function isSoldOut(p: Pick<Product, "availability" | "options">) {
  return p.availability === "soldout" || optionsBlocked(p);
}

/** Precio de una pieza: base + extras de los valores elegidos. Sin precio base, queda en consulta. */
export function unitPrice(p: Pick<Product, "price" | "options">, picked: Record<string, string>): number | null {
  if (p.price == null) return null;
  let total = p.price;
  for (const o of p.options ?? []) total += o.values.find((v) => v.label === picked[o.name])?.extra ?? 0;
  return total;
}

/** «Talla M · Sabor Fresa», en el orden del producto. */
export function variantText(p: Pick<Product, "options">, picked: Record<string, string>) {
  return (p.options ?? []).filter((o) => picked[o.name]).map((o) => `${o.name} ${picked[o.name]}`).join(" · ");
}

/** ¿La selección guardada sigue siendo válida con las opciones actuales? */
export function pickValid(p: Pick<Product, "options">, picked: Record<string, string> | undefined) {
  const opts = p.options ?? [];
  if (!opts.length) return !picked || Object.keys(picked).length === 0;
  if (!picked) return false;
  return opts.every((o) => o.values.some((v) => v.label === picked[o.name] && !v.soldOut));
}
