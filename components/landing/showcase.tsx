"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { showcases } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function Showcase() {
  const [active, setActive] = React.useState(showcases[0].key);
  const reduce = useReducedMotion();

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
            className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-[0.95rem] font-medium transition-colors", active === s.key ? "text-white" : "bg-white text-ink ring-1 ring-ink/10 hover:bg-spaceMist/60 hover:text-blueInk")}
          >
            {active === s.key && (
              <motion.span layoutId="showcase-pill" className="absolute inset-0 -z-0 rounded-full bg-blueInk" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }} />
            )}
            <span className="relative">{s.tab}</span>
          </button>
        ))}
      </div>

      {/* Todos los paneles comparten la misma celda para que la altura no cambie al cambiar de tab. */}
      <div className="mt-8 grid">
        {showcases.map((sc) => {
          const on = sc.key === active;
          return (
            <div
              key={sc.key}
              id={`panel-${sc.key}`}
              role="tabpanel"
              aria-labelledby={`tab-${sc.key}`}
              aria-hidden={!on}
              inert={!on}
              data-on={on}
              className={cn(
                "group col-start-1 row-start-1 rounded-3xl bg-white p-4 ring-1 ring-ink/5 transition-[opacity,transform] duration-300 sm:p-6",
                on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <p className="font-display text-xl font-semibold text-ink">{sc.store}</p>
                <p className="text-sm text-muted-foreground">{sc.line} · ejemplo</p>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {sc.items.map((item, i) => (
                  <li
                    key={item.name}
                    style={{ ["--d" as string]: `${i * 70}ms` }}
                    className="translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out group-data-[on=true]:translate-y-0 group-data-[on=true]:opacity-100 group-data-[on=true]:[transition-delay:var(--d)]"
                  >
                    <div className="group/card">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-spaceMist">
                        <Image src={item.photo} alt={item.name} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]" />
                        {item.note && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink">{item.note}</span>}
                      </div>
                      <p className="mt-2.5 text-[0.95rem] font-medium text-ink">{item.name}</p>
                      <p className="text-[0.95rem] font-semibold tabular-nums text-ink">{item.price}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
