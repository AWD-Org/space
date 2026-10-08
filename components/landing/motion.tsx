"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Devuelve true cuando el elemento entra en pantalla, o cuando ya quedó por encima
 * (por ejemplo, tras saltar con una ancla o con la tecla Fin). Una sola vez.
 */
export function useRevealed(ref: React.RefObject<Element | null>, margin = "0px 0px -10% 0px") {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || on) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) setOn(true);
      },
      { rootMargin: margin }
    );
    io.observe(el);
    let raf = 0;
    const check = () => {
      raf = 0;
      if (el.getBoundingClientRect().bottom < 0) setOn(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, margin, on]);
  return on;
}

/** Entrada suave al hacer scroll. Con movimiento reducido se muestra al instante. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const on = useRevealed(ref);
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      initial={{ opacity: 0, y }}
      animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Titular que sube palabra por palabra desde una máscara. */
export function WordsReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useRevealed(ref, "0px 0px -12% 0px");
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <React.Fragment key={i}>
          <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: inView ? 0 : "110%" }}
              transition={reduce ? { duration: 0 } : { duration: 0.8, delay: delay + i * 0.045, ease: EASE }}
            >
              {word}
            </motion.span>
          </span>{" "}
        </React.Fragment>
      ))}
    </span>
  );
}

function ScrollWord({ word, progress, from, to, reduce }: { word: string; progress: MotionValue<number>; from: number; to: number; reduce: boolean }) {
  const color = useTransform(progress, [from, to], ["#6E7280", "#1E1F24"]);
  return <motion.span style={reduce ? { color: "#1E1F24" } : { color }}>{word}</motion.span>;
}

/** Texto que se enciende palabra por palabra mientras se hace scroll. */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "end 0.55"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <ScrollWord word={w} progress={scrollYProgress} from={i / words.length} to={Math.min(1, (i + 1.6) / words.length)} reduce={reduce} />{" "}
        </React.Fragment>
      ))}
    </p>
  );
}

/** Mueve su contenido a una velocidad distinta que el scroll. */
export function Parallax({ children, distance = 30, className }: { children: React.ReactNode; distance?: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Capa de imagen que se desplaza apenas dentro de su marco (el marco debe tener overflow-hidden). */
export function ParallaxFill({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);
  return (
    <motion.div ref={ref} style={{ y }} className="absolute inset-x-0 -inset-y-[9%]">
      {children}
    </motion.div>
  );
}

/** Crece desde un tamaño menor al entrar en pantalla. */
export function ScaleOnScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.93, 1]);
  return (
    <motion.div ref={ref} style={{ scale }} className={className}>
      {children}
    </motion.div>
  );
}

/** El elemento sigue un poco al cursor. Solo con mouse y sin movimiento reducido. */
export function Magnetic({ children, strength = 0.22, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });
  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Botón principal de la landing: flecha que avanza y leve imán. */
export function CtaLink({ href, children, className, magnetic = true }: { href: string; children: React.ReactNode; className?: string; magnetic?: boolean }) {
  const button = (
    <Button asChild size="lg" className={cn("group h-14 px-7 text-[1.05rem]", className)}>
      <Link href={href}>
        {children}
        <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden />
      </Link>
    </Button>
  );
  return magnetic ? <Magnetic>{button}</Magnetic> : button;
}

/** Barra fina que avanza con el scroll de la página. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-blueInk" />;
}

/** Scroll con inercia (Lenis). Se apaga con movimiento reducido. */
export function SmoothScroll() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    const start = () => {
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({
          duration: 1.15,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          anchors: { offset: -72 },
          autoRaf: true,
        });
        destroy = () => lenis.destroy();
      });
    };
    // Se carga cuando el navegador está libre, para no competir con el primer pintado.
    const id = window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      clearTimeout(id);
      destroy?.();
    };
  }, []);
  return null;
}

/** Cuenta desde cero hasta el valor cuando entra en pantalla. */
export function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useRevealed(ref);
  const reduce = useReducedMotion();
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView || reduce) {
      el.textContent = `${prefix}${value}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => (el.textContent = `${prefix}${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, reduce, value, prefix, suffix]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
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
