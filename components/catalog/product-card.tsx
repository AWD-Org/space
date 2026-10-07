"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import * as React from "react";
import { formatPrice, AVAILABILITY_LABEL } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBag } from "./bag";

export function ProductCard({
  product,
  onOpen,
  canOrder,
  sizes = "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw",
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
  const { add, items } = useBag();
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
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-spaceMist text-left"
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
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-lg font-medium text-blueInk/70">
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
        <motion.button
          type="button"
          onClick={() => add(product)}
          whileTap={reduce ? undefined : { scale: 0.85 }}
          className={cn(
            "absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full shadow-md ring-1 ring-black/5 transition-colors",
            inBag ? "bg-[var(--accent)] text-white" : "bg-white text-ink hover:bg-cloud"
          )}
          aria-label={inBag ? `${inBag} en la bolsa. Agregar otro ${product.name}` : `Agregar ${product.name} a la bolsa`}
        >
          {inBag ? (
            <span className="text-sm font-semibold tabular-nums">{inBag}</span>
          ) : (
            <Plus className="h-5 w-5" aria-hidden />
          )}
        </motion.button>
      )}
      </div>

      <button type="button" onClick={onOpen} className="mt-2.5 text-left">
        <Title className="line-clamp-2 font-sans text-[0.95rem] font-medium leading-snug text-ink">{product.name}</Title>
        <p className="mt-0.5 text-[0.95rem] font-semibold tabular-nums text-ink">{formatPrice(product.price, product.priceFrom)}</p>
      </button>
    </article>
  );
}
