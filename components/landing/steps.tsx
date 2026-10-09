"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useRevealed } from "./motion";
import { Camera, CheckCheck, Copy } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Paso 1: el precio se escribe solo al entrar en pantalla. */
export function PriceStep({ image, name, price }: { image: string; name: string; price: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useRevealed(ref, "0px 0px -20% 0px");
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(price.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= price.length) clearInterval(t);
    }, 240);
    return () => clearInterval(t);
  }, [inView, reduce, price]);

  return (
    <div ref={ref} className="flex w-full max-w-[240px] items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl skeleton-img">
        <Image src={image} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <div className="flex h-8 items-center rounded-lg bg-cloud px-2.5 text-sm tabular-nums text-ink">
          <span className="sr-only">Precio {price}</span>
          <span aria-hidden>{price.slice(0, n)}</span>
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-blueInk" aria-hidden />
        </div>
      </div>
      <Camera className="h-5 w-5 shrink-0 text-blueInk" aria-hidden />
    </div>
  );
}

/** Paso 2: el QR aparece y el link se acomoda debajo. */
export function ShareStep({ qr }: { qr: string }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const on = useRevealed(ref, "0px 0px -20% 0px");
  return (
    <motion.div
      ref={ref}
      className="flex w-full max-w-[240px] flex-col items-center gap-3"
      initial="hidden"
      animate={on ? "show" : "hidden"}
      transition={{ staggerChildren: reduce ? 0 : 0.18 }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, scale: reduce ? 1 : 0.6 }, show: { opacity: 1, scale: 1 } }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18 }}
        className="h-24 w-24 rounded-xl bg-white p-2 shadow-sm [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: qr }}
        aria-hidden
      />
      <motion.div
        variants={{ hidden: { opacity: 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0 } }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE }}
        className="group flex w-full items-center justify-between gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm shadow-sm"
      >
        <span className="truncate text-ink">space.amoxtli.tech/tu-tienda</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-spaceMist text-blueInk transition-colors group-hover:bg-blueInk group-hover:text-white" aria-hidden>
          <Copy className="h-3.5 w-3.5" />
        </span>
      </motion.div>
    </motion.div>
  );
}

/** Paso 3: las líneas del pedido llegan una por una. */
export function OrderStep() {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const on = useRevealed(ref, "0px 0px -20% 0px");
  const line = {
    hidden: { opacity: 0, x: reduce ? 0 : 10 },
    show: { opacity: 1, x: 0 },
  };
  const t = reduce ? { duration: 0 } : { duration: 0.45, ease: EASE };
  return (
    <motion.div
      ref={ref}
      className="w-full max-w-[240px] rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-[#111B21] shadow-sm"
      initial="hidden"
      animate={on ? "show" : "hidden"}
      transition={{ staggerChildren: reduce ? 0 : 0.22 }}
    >
      <motion.p variants={line} transition={t}>• 2 × Galletas con chispas</motion.p>
      <motion.p variants={line} transition={t}>• 1 × Café frío</motion.p>
      <motion.p variants={line} transition={t} className="font-semibold">Total aproximado: $95 MXN</motion.p>
      <motion.p variants={line} transition={t}>Entrega: Centro, a la 1</motion.p>
      <motion.p variants={line} transition={t} className="text-[#54656F]">(Pedido armado en Space®)</motion.p>
      <motion.p variants={line} transition={t} className="flex items-center justify-end gap-1 text-[0.7rem] text-[#54656F]">
        1:02 p.m. <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" aria-hidden />
      </motion.p>
    </motion.div>
  );
}
