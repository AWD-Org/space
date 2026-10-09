"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCheck, MapPin, ShoppingBag } from "lucide-react";
import { BagProvider, useBag, type BagItem } from "@/components/catalog/bag";
import { ProductCard } from "@/components/catalog/product-card";
import { demoProducts, demoStore } from "@/lib/demo";
import { formatPrice } from "@/lib/format";
import { bagTotal } from "@/lib/whatsapp";
import { PhoneFrame } from "./phone-frame";
import { NumberTicker } from "./motion";

const start: BagItem[] = [{ productId: "galletas", name: "Galletas con chispas", price: 2500, priceFrom: false, qty: 2, image: demoProducts[0].images[0].url }];

function MiniCatalog() {
  const { add, count, lines } = useBag();
  const reduce = useReducedMotion();
  const { total } = bagTotal(lines);
  return (
    <div style={{ ["--accent" as string]: demoStore.accent }} className="relative h-full">
      <div className="no-scrollbar h-full overflow-y-auto px-3.5 pb-24 pt-11">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-white" aria-hidden>
            AV
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[1.05rem] font-semibold leading-tight text-ink">{demoStore.name}</p>
            <p className="truncate text-xs text-muted-foreground">{demoStore.tagline}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EE] px-2 py-1 font-medium text-[#146C3B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1A8D4A]" aria-hidden />
            Tomando pedidos
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-1 text-ink">
            <MapPin className="h-3 w-3 text-slate" aria-hidden />
            {demoStore.deliveryNote}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-4">
          {demoProducts.map((p) => (
            <ProductCard key={p.id} product={p} canOrder onOpen={() => p.availability !== "soldout" && add(p)} sizes="140px" headingLevel="p" />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-3 bottom-4 z-20 flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] pl-4 pr-1.5 text-sm text-white shadow-lg"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="font-medium">
              {count} {count === 1 ? "producto" : "productos"}
            </span>
            <span className="ml-auto rounded-full bg-white/15 px-3 py-1.5 font-semibold tabular-nums">{formatPrice(total)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatPreview() {
  const { lines } = useBag();
  const reduce = useReducedMotion();
  const { total, partial } = bagTotal(lines);
  const format = React.useCallback((n: number) => formatPrice(n), []);

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-3xl bg-[#EFEAE2] shadow-[0_24px_50px_-24px_rgba(30,31,36,0.35)] ring-1 ring-ink/5" aria-live="polite">
      <div className="flex items-center gap-3 bg-[#F7F5F2] px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#B4235A] text-xs font-semibold text-white" aria-hidden>
          AV
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">{demoStore.name}</p>
          <p className="text-xs text-muted-foreground">Así te llega el pedido</p>
        </div>
      </div>
      <div className="p-3">
        <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-[#111B21] shadow-sm">
          <p>Hola Antojos de Vale, quiero hacer un pedido:</p>
          <ul className="mt-2">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.name}
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                >
                  • {l.qty} × {l.name}
                  {l.price != null && <span className="text-[#44545C]"> · {formatPrice(l.price * l.qty)}</span>}
                </motion.li>
              ))}
            </AnimatePresence>
            {lines.length === 0 && <li className="text-[#44545C]">(toca el + en un producto)</li>}
          </ul>
          <p className="mt-2 font-semibold">
            Total{partial ? " aproximado" : ""}: <NumberTicker value={total} format={format} />
          </p>
          <p>A nombre de: Diego</p>
          <p>Entrega: Centro, a la 1</p>
          <p className="mt-2 text-[#44545C]">(Pedido armado en Space®)</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[0.7rem] text-[#44545C]">
            1:02 p.m. <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" aria-hidden />
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroDemo() {
  return (
    <BagProvider initialItems={start}>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-center lg:justify-end">
        <div className="relative">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">Catálogo de ejemplo. Toca el +</p>
          <PhoneFrame label="Catálogo de ejemplo de Antojos de Vale">
            <MiniCatalog />
          </PhoneFrame>
        </div>
        <div className="w-full max-w-[320px] md:mb-10">
          <ChatPreview />
        </div>
      </div>
    </BagProvider>
  );
}
