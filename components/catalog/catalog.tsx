"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpDown, Check, MapPin, MessageCircle, Search, Share2, ShoppingBag, Wallet, X } from "lucide-react";
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

const WRAP = "mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8";
type Sort = "default" | "asc" | "desc";

function track(storeId: string, kind: "view" | "order" | "product", productId?: string) {
  try {
    const body = JSON.stringify({ storeId, kind, productId });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* métricas opcionales */
  }
}

function ShareButton({ name, slug }: { name: string; slug: string }) {
  const [copied, setCopied] = React.useState(false);
  async function share() {
    const url = `${window.location.origin}/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* cancelado */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cloud text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-ink/10"
      aria-label={copied ? "Link copiado" : `Compartir ${name}`}
      title={copied ? "Link copiado" : "Compartir"}
    >
      {copied ? <Check className="h-[18px] w-[18px]" aria-hidden /> : <Share2 className="h-[18px] w-[18px]" aria-hidden />}
    </button>
  );
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
  const { count, lines, items } = useBag();
  const [framed, setFramed] = React.useState(false);
  React.useEffect(() => setFramed(window.self !== window.top), []);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("default");
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);
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
    if (onlyAvailable && p.availability === "soldout") return false;
    if (category === "__none" ? p.categoryId : category && p.categoryId !== category) return false;
    if (!normalized) return true;
    const hay = `${p.name} ${p.description}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return hay.includes(normalized);
  });
  // Lo agotado va al final
  const priceOf = (p: Product, empty: number) => (typeof p.price === "number" ? p.price : empty);
  visible.sort((a, b) => {
    const sold = Number(a.availability === "soldout") - Number(b.availability === "soldout");
    if (sold) return sold;
    if (sort === "asc") return priceOf(a, Infinity) - priceOf(b, Infinity);
    if (sort === "desc") return priceOf(b, -Infinity) - priceOf(a, -Infinity);
    return 0;
  });
  const hasSoldOut = products.some((p) => p.availability === "soldout");
  const filtering = Boolean(normalized) || category !== null || onlyAvailable;
  function clearFilters() {
    setQuery("");
    setCategory(null);
    setOnlyAvailable(false);
  }

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
    <div style={{ ["--accent" as string]: store.accent }} className="min-h-dvh bg-white pb-32">
      {ownerPreview && !framed && (
        <div className="bg-ink px-4 py-2.5 text-center text-sm text-white">
          Vista previa: solo tú puedes ver esta página hasta que la publiques.{" "}
          <Link href="/app" className="underline underline-offset-2">
            Volver al panel
          </Link>
        </div>
      )}

      <header>
        <div
          className="relative h-32 overflow-hidden sm:h-60"
          style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 52%, #0B0C10))" }}
          aria-hidden
        >
          {store.logo && <Image src={store.logo.url} alt="" fill sizes="100vw" className="scale-125 object-cover opacity-40 blur-2xl" priority />}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(60% 90% at 88% 0%, rgba(255,255,255,0.32), transparent 62%), radial-gradient(50% 80% at 0% 100%, rgba(255,255,255,0.16), transparent 62%)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }}
          />
        </div>

        <div className={WRAP}>
          <div className="-mt-10 flex flex-col gap-3 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-[var(--accent)] font-display text-2xl font-semibold text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] ring-4 ring-white sm:h-28 sm:w-28 sm:rounded-[1.75rem] sm:text-4xl">
              {store.logo ? <Image src={store.logo.url} alt={`Logo de ${store.name}`} fill sizes="112px" className="object-cover" priority /> : storeInitials(store.name)}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">{store.name}</h1>
              {store.tagline && <p className="mt-2 max-w-xl text-[1.0625rem] leading-snug text-muted-foreground">{store.tagline}</p>}
            </div>
            <div className="flex items-center gap-2 sm:pb-2">
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hola ${store.name}, vi tu catálogo en Space®.`)}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90 sm:flex-none"
                >
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
                  Escribir
                </a>
              )}
              <ShareButton name={store.name} slug={store.slug} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm sm:hidden">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium", store.isOpen ? "bg-[#E7F6EE] text-[#146C3B]" : "bg-cloud text-muted-foreground")}>
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

          <dl className="mt-6 hidden overflow-hidden rounded-2xl bg-white text-sm ring-1 ring-ink/[0.08] sm:flex sm:divide-x sm:divide-ink/[0.07]">
            <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", store.isOpen ? "bg-[#E7F6EE]" : "bg-cloud")}>
                <span className={cn("h-2.5 w-2.5 rounded-full", store.isOpen ? "bg-[#1A8D4A]" : "bg-slate")} aria-hidden />
              </span>
              <div>
                <dt className="text-xs text-muted-foreground">Pedidos</dt>
                <dd className="font-medium text-ink">{store.isOpen ? "Tomando pedidos" : "Hoy no está vendiendo"}</dd>
              </div>
            </div>
            {store.deliveryNote && (
              <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud">
                  <MapPin className="h-4 w-4 text-ink" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Entrega</dt>
                  <dd className="font-medium leading-snug text-ink">{store.deliveryNote}</dd>
                </div>
              </div>
            )}
            {store.paymentMethods.length > 0 && (
              <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud">
                  <Wallet className="h-4 w-4 text-ink" aria-hidden />
                </span>
                <div>
                  <dt className="text-xs text-muted-foreground">Pago</dt>
                  <dd className="font-medium text-ink">{store.paymentMethods.map((m) => PAYMENT_LABEL[m]).join(" · ")}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </header>

      <div className="sticky top-0 z-20 mt-5 border-b border-ink/5 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className={cn(WRAP, "py-2.5")}>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate" aria-hidden />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar en ${store.name}`}
                aria-label="Buscar productos"
                className="h-12 w-full rounded-full bg-cloud pl-11 pr-11 text-base text-ink placeholder:text-slate focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-ink/10 text-ink hover:bg-ink/15" aria-label="Borrar búsqueda">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {products.length > 1 && (
              <label className="relative shrink-0">
                <span className="sr-only">Ordenar por</span>
                <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" aria-hidden />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="h-12 w-12 cursor-pointer appearance-none rounded-full bg-cloud text-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-auto sm:pl-10 sm:pr-5 sm:text-sm sm:font-medium sm:text-ink"
                >
                  <option value="default">Destacados</option>
                  <option value="asc">Precio: menor a mayor</option>
                  <option value="desc">Precio: mayor a menor</option>
                </select>
              </label>
            )}
          </div>

          {(usedCategories.length > 0 || hasSoldOut) && (
            <div className="no-scrollbar -mr-3 mt-2.5 flex gap-2 overflow-x-auto pr-3 sm:mr-0 sm:pr-0" role="tablist" aria-label="Filtros">
              {usedCategories.length > 0 &&
                [{ id: null as string | null, name: "Todo" }, ...usedCategories, ...(hasUncategorized ? [{ id: "__none", name: "Otros" }] : [])].map((c) => (
                  <button
                    key={c.id ?? "all"}
                    type="button"
                    role="tab"
                    aria-selected={category === c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      category === c.id ? "bg-ink text-white" : "text-ink ring-1 ring-inset ring-ink/15 hover:bg-cloud"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              {hasSoldOut && (
                <button
                  type="button"
                  aria-pressed={onlyAvailable}
                  onClick={() => setOnlyAvailable((v) => !v)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    onlyAvailable ? "bg-[var(--accent)] text-white" : "text-ink ring-1 ring-inset ring-ink/15 hover:bg-cloud"
                  )}
                >
                  {onlyAvailable && <Check className="h-4 w-4" aria-hidden />}
                  Solo disponibles
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <main className={cn(WRAP, "pt-5")}>
        <h2 className="sr-only">Productos</h2>
        {products.length > 1 && (
          <div className="mb-4 flex min-h-8 items-center justify-between gap-3 text-sm text-muted-foreground">
            <p className="tabular-nums" aria-live="polite">
              {filtering ? `${visible.length} de ${products.length} productos` : `${products.length} productos`}
            </p>
            {filtering && (
              <button type="button" onClick={clearFilters} className="rounded-full px-3 py-1.5 font-medium text-ink underline underline-offset-4 hover:bg-cloud">
                Limpiar
              </button>
            )}
          </div>
        )}
        {visible.length === 0 ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cloud text-slate">
              <Search className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-4 font-display text-xl font-medium text-ink">
              {products.length === 0 ? "Aún no hay productos" : query.trim() ? `Nada para “${query.trim()}”` : "Nada con esos filtros"}
            </p>
            {products.length === 0 ? (
              <p className="mt-1 text-muted-foreground">Esta tienda todavía no sube productos. Vuelve pronto.</p>
            ) : (
              <>
                <p className="mt-1 text-muted-foreground">Prueba con otra palabra o pregúntale directo a la tienda.</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button type="button" onClick={clearFilters} className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-white hover:bg-ink/90">
                    Ver todo el catálogo
                  </button>
                  {store.whatsapp && (
                    <a
                      href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hola ${store.name}, busco ${query.trim() || "un producto"} y no lo encontré en tu catálogo de Space®.`)}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-ink ring-1 ring-inset ring-ink/15 hover:bg-cloud"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      Preguntar por WhatsApp
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} onOpen={() => open(p)} canOrder={canOrder} priority={i < 4} />
            ))}
          </div>
        )}
      </main>

      <footer className={cn(WRAP, "mt-16 text-center text-sm text-muted-foreground")}>
        <Link href="/?ref=catalogo" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:text-ink">
          <svg viewBox="0 0 64 64" className="h-3.5 w-3.5" aria-hidden>
            <path d="M32 8l8 16 16 8-16 8-8 16-8-16-16-8 16-8z" fill="#4F6BFF" />
          </svg>
          Hecho en Space®. Crea tu espacio gratis
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
              className="mx-auto flex h-16 w-full max-w-md items-center gap-3 rounded-full bg-[var(--accent)] pl-3 pr-2.5 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20"
              aria-label={`Ver pedido: ${count} ${count === 1 ? "producto" : "productos"}`}
            >
              <span className="flex -space-x-2.5" aria-hidden>
                {items.slice(0, 3).map((it) => (
                  <span key={it.productId} className="relative h-10 w-10 overflow-hidden rounded-full bg-white/25 ring-2 ring-[var(--accent)]">
                    {it.image && <Image src={it.image} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                ))}
              </span>
              <span className="min-w-0 text-left leading-tight">
                <span className="block text-[0.95rem] font-semibold">Ver mi pedido</span>
                <span className="block text-xs text-white/80">
                  {count} {count === 1 ? "producto" : "productos"}
                </span>
              </span>
              <span className="ml-auto rounded-full bg-white px-4 py-2.5 font-semibold tabular-nums text-ink">
                {total > 0 ? `${partial ? "≈ " : ""}${formatPrice(total)}` : "Ver"}
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
