"use client";

import * as React from "react";
import type { Product } from "@/lib/types";
import type { BagLine } from "@/lib/whatsapp";

export interface BagItem {
  productId: string;
  name: string;
  price: number | null;
  priceFrom: boolean;
  qty: number;
  image?: string;
}

type Action =
  | { type: "add"; product: Product; qty?: number }
  | { type: "set"; productId: string; qty: number }
  | { type: "clear" }
  | { type: "load"; items: BagItem[] };

function reducer(state: BagItem[], action: Action): BagItem[] {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const found = state.find((i) => i.productId === action.product.id);
      if (found) return state.map((i) => (i.productId === action.product.id ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      const p = action.product;
      return [...state, { productId: p.id, name: p.name, price: p.price, priceFrom: p.priceFrom, qty, image: p.images[0]?.url }];
    }
    case "set":
      return action.qty <= 0
        ? state.filter((i) => i.productId !== action.productId)
        : state.map((i) => (i.productId === action.productId ? { ...i, qty: Math.min(99, action.qty) } : i));
    case "clear":
      return [];
    case "load":
      return action.items;
  }
}

interface BagContextValue {
  items: BagItem[];
  count: number;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
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
      add: (product, qty) => dispatch({ type: "add", product, qty }),
      setQty: (productId, qty) => dispatch({ type: "set", productId, qty }),
      clear: () => dispatch({ type: "clear" }),
      lines: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, priceFrom: i.priceFrom })),
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
