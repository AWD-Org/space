"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ROW = 56; // px entre pasos

/**
 * Pantalla completa con una lista de pasos que avanza sola.
 * El último paso se queda activo hasta que el componente se desmonta (cuando termina la acción real).
 */
export function MultiStepLoader({ steps, loading, interval = 700 }: { steps: string[]; loading: boolean; interval?: number }) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!loading) {
      setCurrent(0);
      return;
    }
    const t = setInterval(() => setCurrent((c) => Math.min(c + 1, steps.length - 1)), interval);
    return () => clearInterval(t);
  }, [loading, steps.length, interval]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-white"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative h-[420px] w-full max-w-sm overflow-hidden px-8 [mask-image:linear-gradient(to_bottom,transparent,black_28%,black_72%,transparent)]">
            <ol className="absolute inset-x-8 top-1/2" style={{ height: 0 }}>
              {steps.map((label, i) => {
                const distance = i - current;
                const done = i < current;
                const active = i === current;
                return (
                  <motion.li
                    key={label}
                    className="absolute inset-x-0 flex items-center gap-4"
                    style={{ height: ROW, marginTop: -ROW / 2 }}
                    initial={false}
                    animate={{ y: distance * ROW, opacity: active ? 1 : Math.max(0.12, 0.55 - Math.abs(distance) * 0.2), filter: `blur(${active ? 0 : Math.min(Math.abs(distance), 3) * 0.6}px)` }}
                    transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors duration-500",
                        done ? "border-blueInk bg-blueInk text-white" : active ? "border-blueInk text-blueInk" : "border-ink/20 text-transparent",
                      )}
                      aria-hidden
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : active ? <span className="h-2 w-2 rounded-full bg-blueInk motion-safe:animate-pulse" /> : null}
                    </span>
                    <span className={cn("font-display text-xl transition-colors duration-500", active ? "font-semibold text-ink" : "text-ink/70")}>{label}</span>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
