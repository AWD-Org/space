"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { showcases } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function Showcase() {
  const [active, setActive] = React.useState(showcases[0].key);
  const reduce = useReducedMotion();
  const current = showcases.find((s) => s.key === active)!;

  return (
    <div>
      <div role="tablist" aria-label="Tipos de catálogo" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {showcases.map((s) => (
          <button
            key={s.key}
            role="tab"
            id={`tab-${s.key}`}
            aria-selected={active === s.key}
            aria-controls={`panel-${s.key}`}
            onClick={() => setActive(s.key)}
            className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-[0.95rem] font-medium transition-colors", active === s.key ? "text-white" : "bg-white text-ink ring-1 ring-ink/10 hover:bg-spaceMist/60")}
          >
            {active === s.key && (
              <motion.span layoutId="showcase-pill" className="absolute inset-0 -z-0 rounded-full bg-blueInk" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }} />
            )}
            <span className="relative">{s.tab}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.key}
          id={`panel-${current.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.key}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="mt-8 rounded-3xl bg-white p-4 ring-1 ring-ink/5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <p className="font-display text-xl font-semibold text-ink">{current.store}</p>
            <p className="text-sm text-muted-foreground">{current.line} · ejemplo</p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {current.items.map((item, i) => (
              <motion.li
                key={item.name}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.05, duration: reduce ? 0 : 0.3 }}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-spaceMist">
                  <Image src={item.photo} alt={item.name} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
                  {item.note && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink">{item.note}</span>}
                </div>
                <p className="mt-2.5 text-[0.95rem] font-medium text-ink">{item.name}</p>
                <p className="text-[0.95rem] font-semibold tabular-nums text-ink">{item.price}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
