"use client";

import * as React from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatPrice, AVAILABILITY_LABEL } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { hasPriceExtras, isSoldOut, unitPrice } from "@/lib/options";
import { useBag } from "./bag";

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-full bg-cloud ring-1 ring-inset ring-border">
      <button type="button" onClick={() => onChange(value - 1)} className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5" aria-label={`Quitar uno de ${label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5" aria-label={`Agregar uno de ${label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductSheet({
  product,
  open,
  onOpenChange,
  canOrder,
  closedReason,
  accent,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canOrder: boolean;
  closedReason?: string;
  accent: string;
}) {
  const { add } = useBag();
  const [qty, setQty] = React.useState(1);
  const [picked, setPicked] = React.useState<Record<string, string>>({});
  const [missing, setMissing] = React.useState(false);
  const [slide, setSlide] = React.useState(0);
  const scroller = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setQty(1);
      setPicked({});
      setMissing(false);
      setSlide(0);
      scroller.current?.scrollTo({ left: 0 });
    }
  }, [open, product?.id]);

  if (!product) return null;
  const soldOut = isSoldOut(product);
  const options = product.options ?? [];
  const lacking = options.filter((o) => !picked[o.name]);
  const unit = unitPrice(product, picked);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={product.name} hideTitle side="bottom" style={{ ["--accent" as string]: accent }} className="overflow-hidden sm:w-[min(880px,calc(100vw-2rem))]">
        <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div className="relative">
            <div
              ref={scroller}
              onScroll={(e) => {
                const el = e.currentTarget;
                setSlide(Math.round(el.scrollLeft / el.clientWidth));
              }}
              className="no-scrollbar flex h-[min(56dvh,480px)] snap-x snap-mandatory overflow-x-auto skeleton-img sm:h-auto sm:aspect-[4/5] sm:rounded-2xl"
            >
              {product.images.length ? (
                product.images.map((img, i) => (
                  <div key={img.path} className="relative h-full w-full shrink-0 snap-center">
                    <Image src={img.url} alt={`${product.name}, foto ${i + 1}`} fill sizes="(min-width: 640px) 420px, 100vw" className="object-cover" priority={i === 0} />
                  </div>
                ))
              ) : (
                <div className="grid w-full place-items-center p-8 text-center font-display text-2xl text-[#2F43B8]">{product.name}</div>
              )}
            </div>
            {product.images.length > 1 && (
              <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur" aria-hidden>
                {slide + 1}/{product.images.length}
              </span>
            )}
            {product.images.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
                {product.images.map((img, i) => (
                  <span key={img.path} className={cn("h-1.5 rounded-full bg-white transition-all", i === slide ? "w-5" : "w-1.5 opacity-60")} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col p-5 sm:p-0 sm:pt-10">
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">{product.name}</h2>
            <p className="mt-2 text-xl font-semibold tabular-nums text-ink">{formatPrice(unit, product.priceFrom || (hasPriceExtras(product) && lacking.length > 0))}</p>
            {product.availability !== "available" && (
              <p className="mt-3 inline-flex w-fit rounded-full bg-cloud px-3 py-1 text-sm font-medium text-ink ring-1 ring-inset ring-border">
                {AVAILABILITY_LABEL[product.availability]}
              </p>
            )}
            {product.description && <p className="mt-4 whitespace-pre-line text-[1.0625rem] leading-relaxed text-muted-foreground">{product.description}</p>}
            {options.length > 0 && !soldOut && canOrder && (
              <div className="mt-5 space-y-4">
                {options.map((o) => (
                  <fieldset key={o.name} id={`opt-${o.name}`} className="scroll-mt-4">
                    <legend className={cn("mb-2 text-sm font-medium", missing && !picked[o.name] ? "text-destructive" : "text-ink")}>
                      {o.name}
                      {picked[o.name] && <span className="font-normal text-muted-foreground"> · {picked[o.name]}</span>}
                    </legend>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={o.name}>
                      {o.values.map((v) => {
                        const on = picked[o.name] === v.label;
                        return (
                          <button
                            key={v.label}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={v.soldOut}
                            aria-label={v.soldOut ? `${v.label}, agotado` : undefined}
                            onClick={() => setPicked((cur) => ({ ...cur, [o.name]: v.label }))}
                            className={cn(
                              "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                              v.soldOut && "cursor-not-allowed bg-cloud text-muted-foreground line-through ring-1 ring-inset ring-ink/10",
                              !v.soldOut && (on ? "bg-[var(--accent)] text-white" : "bg-white text-ink ring-1 ring-inset ring-ink/20 hover:bg-cloud")
                            )}
                          >
                            {v.label}
                            {!!v.extra && !v.soldOut && <span className={cn("text-xs font-normal tabular-nums", on ? "text-white/85" : "text-muted-foreground")}>+${(v.extra / 100).toLocaleString("es-MX")}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}

          </div>
        </div>
        <div className="border-t border-ink/10 bg-white px-5 pb-safe pt-3 sm:px-6 sm:pb-5">
              {!canOrder ? (
                <p className="rounded-2xl bg-cloud p-4 text-sm text-muted-foreground">{closedReason}</p>
              ) : soldOut ? (
                <p className="rounded-2xl bg-cloud p-4 text-sm text-muted-foreground">Este producto está agotado por ahora.</p>
              ) : (
                <div className="flex items-center gap-3">
                  <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(99, n)))} label={product.name} />
                  <button
                    type="button"
                    onClick={() => {
                      if (lacking.length > 0) {
                        setMissing(true);
                        document.getElementById(`opt-${lacking[0].name}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                        return;
                      }
                      add(product, qty, picked);
                      onOpenChange(false);
                    }}
                    className="h-12 flex-1 rounded-full bg-[var(--accent)] px-5 font-medium text-white transition-[filter] hover:brightness-110"
                  >
                    {missing && lacking.length > 0 ? `Elige ${lacking.map((o) => o.name.toLowerCase()).join(" y ")}` : "Agregar"}
                    {!(missing && lacking.length > 0) && unit != null && <span className="tabular-nums"> · {formatPrice(unit * qty)}</span>}
                  </button>
                </div>
              )}
            </div>
      </SheetContent>
    </Sheet>
  );
}
