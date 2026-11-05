"use client";

import * as React from "react";
import type { Product } from "@/lib/types";
import type { BagLine } from "@/lib/whatsapp";
import { pickValid, unitPrice, variantText } from "@/lib/options";
import { availableFor, sharesPool } from "@/lib/stock";
import { toast } from "@/lib/toast";

export interface BagItem {
  productId: string;
  /** Producto + variante elegida; un mismo producto con otra talla o color es otra línea. */
  key?: string;
  /** Texto de la variante elegida, p. ej. «Talla M · Color Rojo». */
  variant?: string;
  /** Valor elegido en cada opción, para revisar el precio y la disponibilidad al volver a abrir la bolsa. */
  picked?: Record<string, string>;
  name: string;
  price: number | null;
  priceFrom: boolean;
  qty: number;
  image?: string;
  /** Tope de unidades según el stock al agregarlo; ausente = sin límite. Se revisa al volver a abrir la bolsa. */
  max?: number;
  /** El tope se comparte entre todas las variantes del producto (stock por producto con varias opciones). */
  pool?: boolean;
}

export const itemKey = (i: Pick<BagItem, "productId" | "key">) => i.key ?? i.productId;
const HARD_MAX = 99;

/** Cuántas unidades admite esta línea, descontando las demás líneas del mismo producto cuando comparten stock. */
function allowedFor(state: BagItem[], line: Pick<BagItem, "productId" | "key" | "max" | "pool">) {
  if (line.max === undefined) return HARD_MAX;
  const used = line.pool ? state.filter((i) => i.productId === line.productId && itemKey(i) !== itemKey(line)).reduce((n, i) => n + i.qty, 0) : 0;
  return Math.max(0, Math.min(HARD_MAX, line.max - used));
}

type Action =
  | { type: "add"; product: Product; qty?: number; picked?: Record<string, string> }
  | { type: "set"; key: string; qty: number }
  | { type: "clear" }
  | { type: "load"; items: BagItem[] };

function reducer(state: BagItem[], action: Action): BagItem[] {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const picked = action.picked && Object.keys(action.picked).length ? action.picked : undefined;
      const variant = picked ? variantText(action.product, picked) : "";
      const key = variant ? `${action.product.id}|${variant}` : action.product.id;
      const found = state.find((i) => itemKey(i) === key);
      const p = action.product;
      const max = availableFor(p, picked) ?? undefined;
      const line = { productId: p.id, key, max, pool: sharesPool(p) };
      const allowed = allowedFor(state, line);
      if (found) return state.map((i) => (itemKey(i) === key ? { ...i, max, pool: line.pool, qty: Math.min(allowed, i.qty + qty) } : i));
      const first = Math.min(allowed, qty);
      if (first <= 0) return state;
      return [...state, { productId: p.id, key, variant: variant || undefined, picked, name: p.name, price: unitPrice(p, picked ?? {}), priceFrom: p.priceFrom, qty: first, image: p.images[0]?.url, max, pool: line.pool }];
    }
    case "set":
      return action.qty <= 0
        ? state.filter((i) => itemKey(i) !== action.key)
        : state.map((i) => (itemKey(i) === action.key ? { ...i, qty: Math.max(1, Math.min(allowedFor(state, i), action.qty)) } : i));
    case "clear":
      return [];
    case "load":
      return action.items;
  }
}

interface BagContextValue {
  items: BagItem[];
  count: number;
  /** Devuelve cuántas unidades se agregaron (pueden ser menos si el stock no alcanza). */
  add: (p: Product, qty?: number, picked?: Record<string, string>) => number;
  /** Unidades que todavía se pueden agregar de esta variante (Infinity si no hay límite). */
  roomFor: (p: Product, picked?: Record<string, string>) => number;
  /** Máximo de unidades que admite una línea de la bolsa. */
  maxFor: (item: BagItem) => number;
  /** Cantidad de un producto sumando todas sus variantes. */
  countOf: (productId: string) => number;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  lines: BagLine[];
}

const BagContext = React.createContext<BagContextValue | null>(null);

export function BagProvider({
  storageKey,
  validIds,
  products,
  initialItems = [],
  children,
}: {
  storageKey?: string;
  validIds?: string[];
  /** Catálogo actual: al abrir la bolsa se revisan precios y opciones guardados. */
  products?: Product[];
  initialItems?: BagItem[];
  children: React.ReactNode;
}) {
  const [items, dispatch] = React.useReducer(reducer, initialItems);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]") as BagItem[];
      const allowed = validIds ? new Set(validIds) : null;
      const byId = new Map((products ?? []).map((p) => [p.id, p]));
      let dropped = 0;
      let adjusted = 0;
      const kept: BagItem[] = [];
      for (const i of saved) {
        if (allowed && !allowed.has(i.productId)) continue;
        const p = byId.get(i.productId);
        if (!p) {
          kept.push(i);
          continue;
        }
        const hasOpts = (p.options ?? []).length > 0;
        // Compra guardada antes de que existieran opciones (solo texto): se conserva tal cual.
        if (hasOpts && !i.picked && i.variant) {
          kept.push(i);
          continue;
        }
        if (!pickValid(p, i.picked)) {
          dropped += 1;
          continue;
        }
        const max = availableFor(p, i.picked) ?? undefined;
        if (max === 0) {
          dropped += 1;
          continue;
        }
        const next: BagItem = { ...i, name: p.name, price: unitPrice(p, i.picked ?? {}), priceFrom: p.priceFrom, max, pool: sharesPool(p) };
        if (max === undefined) {
          delete next.max;
          delete next.pool;
        }
        const room = allowedFor(kept, next);
        if (room <= 0) {
          dropped += 1;
          continue;
        }
        if (next.qty > room) {
          next.qty = room;
          adjusted += 1;
        }
        kept.push(next);
      }
      dispatch({ type: "load", items: kept });
      if (adjusted > 0) toast.info("Ajustamos las cantidades de tu bolsa a lo que hay disponible.");
      if (dropped > 0) toast.info(dropped === 1 ? "Quitamos 1 producto de tu bolsa: ya no está disponible." : `Quitamos ${dropped} productos de tu bolsa: ya no están disponibles.`);
    } catch {
      /* almacenamiento no disponible */
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey || !loaded.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* sin almacenamiento */
    }
  }, [items, storageKey]);

  const value = React.useMemo<BagContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      add: (product, qty, picked) => {
        const action: Action = { type: "add", product, qty, picked };
        const total = (list: BagItem[]) => list.filter((i) => i.productId === product.id).reduce((n, i) => n + i.qty, 0);
        const added = total(reducer(items, action)) - total(items);
        if (added > 0) dispatch(action);
        return added;
      },
      roomFor: (product, picked) => {
        const max = availableFor(product, picked) ?? undefined;
        if (max === undefined) return Infinity;
        const variant = picked && Object.keys(picked).length ? variantText(product, picked) : "";
        const key = variant ? `${product.id}|${variant}` : product.id;
        const line = { productId: product.id, key, max, pool: sharesPool(product) };
        const have = items.find((i) => itemKey(i) === key)?.qty ?? 0;
        return Math.max(0, allowedFor(items, line) - have);
      },
      maxFor: (item) => allowedFor(items, item),
      countOf: (productId) => items.filter((i) => i.productId === productId).reduce((n, i) => n + i.qty, 0),
      setQty: (key, qty) => dispatch({ type: "set", key, qty }),
      clear: () => dispatch({ type: "clear" }),
      lines: items.map((i) => ({ name: i.name, variant: i.variant, qty: i.qty, price: i.price, priceFrom: i.priceFrom })),
    }),
    [items]
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = React.useContext(BagContext);
  if (!ctx) throw new Error("useBag fuera de BagProvider");
  return ctx;
}
