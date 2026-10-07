"use client";

import * as React from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

/** Entrada suave al hacer scroll. Con movimiento reducido se muestra al instante. */
export function Reveal({ children, delay = 0, className, as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Contador que se anima hacia el valor nuevo (estilo Magic UI). */
export function NumberTicker({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prev = React.useRef(value);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !inView) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => (el.textContent = format(Math.round(v))),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, format, reduce, inView]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
