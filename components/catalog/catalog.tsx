"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPin, Search, ShoppingBag, Wallet, X } from "lucide-react";
import { formatPrice, PAYMENT_LABEL, storeInitials } from "@/lib/format";
import { bagTotal } from "@/lib/whatsapp";
import type { Category, Product, Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BagProvider, useBag } from "./bag";
import { ProductCard } from "./product-card";
import { ProductSheet } from "./product-sheet";
import { BagSheet } from "./bag-sheet";

export type CatalogStore = Pick<
  Store,
  "id" | "name" | "slug" | "tagline" | "whatsapp" | "deliveryNote" | "paymentMethods" | "accent" | "logo" | "isOpen"
>;

interface CatalogProps {
  store: CatalogStore;
  categories: Category[];
  products: Product[];
  initialProductSlug?: string;
  /** Vista previa del dueño o demo de la landing: no registra métricas. */
  track?: boolean;
  ownerPreview?: boolean;
}

function track(storeId: string, kind: "view" | "order" | "product", productId?: string) {
  try {
    const body = JSON.stringify({ storeId, kind, productId });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* métricas opcionales */
  }
}

export function Catalog(props: CatalogProps) {
  return (
    <BagProvider storageKey={`space-bag-${props.store.id}`} validIds={props.products.map((p) => p.id)}>
      <CatalogInner {...props} />
    </BagProvider>
  );
}


function CatalogInner({ store, categories, products, initialProductSlug, track: shouldTrack = true, ownerPreview }: CatalogProps) {
  const reduce = useReducedMotion();
  const { count, lines } = useBag();
  const [framed, setFramed] = React.useState(false);
  React.useEffect(() => setFramed(window.self !== window.top), []);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(
    () => products.find((p) => p.slug === initialProductSlug)?.id ?? null
  );
  const [bagOpen, setBagOpen] = React.useState(false);

  const canOrder = store.isOpen && Boolean(store.whatsapp);
  const closedReason = store.isOpen ? "Esta tienda aún no tiene WhatsApp para pedidos." : `${store.name} no está tomando pedidos hoy. Vuelve pronto.`;

  React.useEffect(() => {
    if (!shouldTrack) return;
    const key = `space-viewed-${store.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sin almacenamiento */
    }
    track(store.id, "view");
  }, [shouldTrack, store.id]);

  const usedCategories = categories.filter((c) => products.some((p) => p.categoryId === c.id));
  const hasUncategorized = usedCategories.length > 0 && products.some((p) => !p.categoryId);

  const normalized = query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  const visible = products.filter((p) => {
    if (category === "__none" ? p.categoryId : category && p.categoryId !== category) return false;
    if (!normalized) return true;
    const hay = `${p.name} ${p.description}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return hay.includes(normalized);
  });
  // Lo agotado va al final
  visible.sort((a, b) => Number(a.availability === "soldout") - Number(b.availability === "soldout"));

  const openProduct = products.find((p) => p.id === openId) ?? null;
  const { total, partial } = bagTotal(lines);

  function open(p: Product) {
    setOpenId(p.id);
    if (shouldTrack) track(store.id, "product", p.id);
    window.history.replaceState(null, "", `/${store.slug}/p/${p.slug}`);
  }

  function close(o: boolean) {
    if (o) return;
    setOpenId(null);
    window.history.replaceState(null, "", `/${store.slug}`);
  }

  return (
    <div style={{ ["--accent" as string]: store.accent }} className="min-h-dvh bg-white pb-28">
      {ownerPreview && !framed && (
        <div className="bg-ink px-4 py-2.5 text-center text-sm text-white">
          Vista previa: solo tú puedes ver esta página hasta que la publiques.{" "}
          <Link href="/app" className="underline underline-offset-2">
            Volver al panel
          </Link>
        </div>
      )}

      <header className="mx-auto max-w-5xl px-4 pb-4 pt-8 sm:px-6 sm:pt-12">
        <div className="flex items-start gap-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--accent)] text-xl font-semibold text-white sm:h-20 sm:w-20">
            {store.logo ? <Image src={store.logo.url} alt={`Logo de ${store.name}`} fill sizes="80px" className="object-cover" priority /> : storeInitials(store.name)}
          </div>
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-4xl">{store.name}</h1>
            {store.tagline && <p className="mt-1 text-[1.0625rem] text-muted-foreground">{store.tagline}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium",
              store.isOpen ? "bg-[#E7F6EE] text-[#146C3B]" : "bg-cloud text-muted-foreground"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", store.isOpen ? "bg-[#1A8D4A]" : "bg-slate")} aria-hidden />
            {store.isOpen ? "Tomando pedidos" : "Hoy no está vendiendo"}
          </span>
          {store.deliveryNote && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cloud px-3 py-1.5 text-ink">
              <MapPin className="h-4 w-4 text-slate" aria-hidden />
              {store.deliveryNote}
            </span>
          )}
          {store.paymentMethods.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cloud px-3 py-1.5 text-ink">
              <Wallet className="h-4 w-4 text-slate" aria-hidden />
              {store.paymentMethods.map((m) => PAYMENT_LABEL[m]).join(" · ")}
            </span>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-ink/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          {products.length > 6 && (
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar en ${store.name}`}
                aria-label="Buscar productos"
                className="h-11 w-full rounded-full bg-cloud pl-10 pr-10 text-[0.95rem] text-ink placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate hover:text-ink" aria-label="Borrar búsqueda">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {usedCategories.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Categorías">
              {[{ id: null as string | null, name: "Todo" }, ...usedCategories, ...(hasUncategorized ? [{ id: "__none", name: "Otros" }] : [])].map((c) => (
                <button
                  key={c.id ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    category === c.id ? "bg-ink text-white" : "bg-cloud text-ink hover:bg-ink/10"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <h2 className="sr-only">Productos</h2>
        {visible.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            {products.length === 0 ? "Esta tienda todavía no tiene productos." : "No encontramos nada con esa búsqueda."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} onOpen={() => open(p)} canOrder={canOrder} priority={i < 4} />
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto mt-16 max-w-5xl px-4 text-center text-sm text-muted-foreground sm:px-6">
        <Link href="/?ref=catalogo" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:text-ink">
          <svg viewBox="0 0 64 64" className="h-3.5 w-3.5" aria-hidden>
            <path d="M32 8l8 16 16 8-16 8-8 16-8-16-16-8 16-8z" fill="#4F6BFF" />
          </svg>
          Hecho con Space. Crea tu catálogo gratis
        </Link>
      </footer>

      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 px-4 pb-safe sm:pb-6"
          >
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="mx-auto flex h-14 w-full max-w-md items-center gap-3 rounded-full bg-[var(--accent)] pl-5 pr-2 text-white shadow-lg shadow-black/15"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <span className="font-medium">
                {count} {count === 1 ? "producto" : "productos"}
              </span>
              <span className="ml-auto rounded-full bg-white/15 px-4 py-2 font-semibold tabular-nums">
                {total > 0 ? `${partial ? "≈ " : ""}${formatPrice(total)}` : "Ver pedido"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductSheet product={openProduct} open={Boolean(openProduct)} onOpenChange={close} canOrder={canOrder} closedReason={closedReason} accent={store.accent} />
      <BagSheet
        open={bagOpen}
        onOpenChange={setBagOpen}
        storeName={store.name}
        whatsapp={store.whatsapp}
        deliveryNote={store.deliveryNote}
        onSend={() => shouldTrack && track(store.id, "order")}
      />
    </div>
  );
}
