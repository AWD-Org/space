"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { formatPrice, AVAILABILITY_LABEL } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBag } from "./bag";

export function ProductCard({
  product,
  onOpen,
  canOrder,
  sizes = "(min-width: 1536px) 15vw, (min-width: 1280px) 19vw, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 46vw",
  priority,
  headingLevel = "h3",
}: {
  product: Product;
  onOpen: () => void;
  canOrder: boolean;
  sizes?: string;
  priority?: boolean;
  headingLevel?: "h3" | "p";
}) {
  const Title = headingLevel;
  const { add, setQty, items } = useBag();
  const reduce = useReducedMotion();
  const inBag = items.find((i) => i.productId === product.id)?.qty ?? 0;
  const soldOut = product.availability === "soldout";
  const image = product.images[0];

  return (
    <article className="group flex flex-col">
      <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn("relative block aspect-[4/5] w-full overflow-hidden rounded-[1.375rem] text-left", image ? "skeleton-img" : "bg-spaceMist")}
        aria-label={`Ver ${product.name}`}
      >
        {image ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes={sizes}
            priority={priority}
            className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", soldOut && "opacity-60 grayscale-[40%]")}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-lg font-medium text-[#2F43B8]">
            {product.name}
          </span>
        )}
        {product.availability !== "available" && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
            {AVAILABILITY_LABEL[product.availability]}
          </span>
        )}
      </button>

      {canOrder && !soldOut && (
        <div className="absolute bottom-2.5 right-2.5">
          {inBag ? (
            <div className="flex items-center rounded-full bg-white p-1 shadow-[0_6px_18px_-4px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
              <button type="button" onClick={() => setQty(product.id, inBag - 1)} className="grid h-9 w-9 place-items-center rounded-full text-ink active:bg-cloud" aria-label={`Quitar uno de ${product.name}`}>
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-ink" aria-live="polite">
                {inBag}
              </span>
              <button type="button" onClick={() => add(product)} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white active:brightness-90" aria-label={`Agregar otro ${product.name}`}>
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={() => add(product)}
              whileTap={reduce ? undefined : { scale: 0.85 }}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-[0_6px_18px_-4px_rgba(0,0,0,0.3)] ring-1 ring-black/5 transition-colors hover:bg-cloud"
              aria-label={`Agregar ${product.name} a la bolsa`}
            >
              <Plus className="h-5 w-5" aria-hidden />
            </motion.button>
          )}
        </div>
      )}
      </div>

      <button type="button" onClick={onOpen} className="mt-2.5 text-left">
        <Title className="line-clamp-2 font-display text-[1rem] font-medium leading-snug text-ink">{product.name}</Title>
        <p className="mt-0.5 text-[0.95rem] font-semibold tabular-nums text-ink">{formatPrice(product.price, product.priceFrom)}</p>
      </button>
    </article>
  );
}
