import type { OptionValue, Product } from "./types";

/** Tope razonable por producto o valor. */
export const MAX_STOCK = 99_999;
/** Desde aquí el catálogo avisa «Quedan N». */
export const LOW_STOCK = 5;

type P = Pick<Product, "options" | "stock">;

/**
 * Dónde vive el stock:
 * - «values»: el producto tiene una sola opción y cada valor lleva su propia cuenta.
 * - «product»: sin opciones, o con 2 o 3 (un solo número para todo el producto).
 */
export function stockMode(p: Pick<Product, "options">): "values" | "product" {
  return (p.options ?? []).length === 1 ? "values" : "product";
}

export const hasStockNumber = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/** ¿Este valor no se puede elegir? Agotado a mano o con stock en 0. */
export const valueUnavailable = (v: OptionValue) => !!v.soldOut || v.stock === 0;

/** ¿El producto lleva la cuenta de unidades? */
export function isTracked(p: P) {
  if (stockMode(p) === "values") return (p.options ?? [])[0]!.values.some((v) => hasStockNumber(v.stock));
  return hasStockNumber(p.stock);
}

/** Producto sin opciones (o con varias) cuyo stock llegó a 0. */
export function productStockOut(p: P) {
  return stockMode(p) === "product" && p.stock === 0;
}

/**
 * Unidades que se pueden pedir de este producto con la selección actual.
 * null = sin límite (no se lleva la cuenta). Con una opción sin elegir, es el total de los valores contados.
 */
export function availableFor(p: P, picked?: Record<string, string>): number | null {
  if (stockMode(p) === "product") return hasStockNumber(p.stock) ? p.stock : null;
  const opt = (p.options ?? [])[0]!;
  const chosen = picked?.[opt.name];
  if (chosen) {
    const v = opt.values.find((x) => x.label === chosen);
    return v && hasStockNumber(v.stock) ? v.stock : null;
  }
  return totalStock(p);
}

/** Total de unidades. null si algún valor no lleva cuenta (entonces no hay un tope único). */
export function totalStock(p: P): number | null {
  if (stockMode(p) === "product") return hasStockNumber(p.stock) ? p.stock : null;
  let sum = 0;
  for (const v of (p.options ?? [])[0]!.values) {
    if (v.soldOut) continue;
    if (!hasStockNumber(v.stock)) return null;
    sum += v.stock;
  }
  return sum;
}

/** ¿Las piezas de distintas variantes comparten una sola cuenta? (stock por producto con varias opciones) */
export const sharesPool = (p: P) => stockMode(p) === "product" && (p.options ?? []).length > 1 && hasStockNumber(p.stock);

/** Texto corto para el panel: «12 en stock», «Sin stock». null si no se cuenta. */
export function stockLabel(p: P): string | null {
  if (!isTracked(p)) return null;
  const t = totalStock(p);
  if (t === null) return "Stock parcial";
  return t === 0 ? "Sin stock" : `${t} en stock`;
}

/** Aviso para quien compra: «Última pieza», «Quedan 3», «12 disponibles». null si no se cuenta. */
export function availabilityNote(n: number | null): string | null {
  if (n === null || n <= 0) return null;
  if (n === 1) return "Última pieza";
  return n <= LOW_STOCK ? `Quedan ${n}` : `${n} disponibles`;
}
