"use client";

import * as React from "react";
import type { Product } from "@/lib/types";
import type { BagLine } from "@/lib/whatsapp";

export interface BagItem {
  productId: string;
  /** Producto + variante elegida; un mismo producto con otra talla o color es otra línea. */
  key?: string;
  /** Texto de la variante elegida, p. ej. «Talla M · Color Rojo». */
  variant?: string;
  name: string;
  price: number | null;
  priceFrom: boolean;
  qty: number;
  image?: string;
}

export const itemKey = (i: Pick<BagItem, "productId" | "key">) => i.key ?? i.productId;
/** Las opciones elegidas (p. ej. { Talla: "M", Color: "Rojo" }) como texto, en el orden del producto. */
export function variantText(product: Product, picked: Record<string, string>) {
  return (product.options ?? []).filter((o) => picked[o.name]).map((o) => `${o.name} ${picked[o.name]}`).join(" · ");
}

type Action =
  | { type: "add"; product: Product; qty?: number; variant?: string }
  | { type: "set"; key: string; qty: number }
  | { type: "clear" }
  | { type: "load"; items: BagItem[] };

function reducer(state: BagItem[], action: Action): BagItem[] {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const key = action.variant ? `${action.product.id}|${action.variant}` : action.product.id;
      const found = state.find((i) => itemKey(i) === key);
      if (found) return state.map((i) => (itemKey(i) === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      const p = action.product;
      return [...state, { productId: p.id, key, variant: action.variant || undefined, name: p.name, price: p.price, priceFrom: p.priceFrom, qty, image: p.images[0]?.url }];
    }
    case "set":
      return action.qty <= 0
        ? state.filter((i) => itemKey(i) !== action.key)
        : state.map((i) => (itemKey(i) === action.key ? { ...i, qty: Math.min(99, action.qty) } : i));
    case "clear":
      return [];
    case "load":
      return action.items;
  }
}

interface BagContextValue {
  items: BagItem[];
  count: number;
  add: (p: Product, qty?: number, variant?: string) => void;
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
  initialItems = [],
  children,
}: {
  storageKey?: string;
  validIds?: string[];
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
      dispatch({ type: "load", items: saved.filter((i) => !allowed || allowed.has(i.productId)) });
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
      add: (product, qty, variant) => dispatch({ type: "add", product, qty, variant }),
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
