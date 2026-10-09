"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useRevealed } from "./motion";
import { CheckCheck } from "lucide-react";
import { demoProducts } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Mode = "antes" | "space";

/** Cada elemento del chat entra con un pequeño retraso cuando el panel está activo. */
function Pop({ i, children, className }: { i: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      style={{ ["--d" as string]: `${i * 170}ms` }}
      className={cn("translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out group-data-[on=true]:translate-y-0 group-data-[on=true]:opacity-100 group-data-[on=true]:[transition-delay:var(--d)]", className)}
    >
      {children}
    </div>
  );
}

function Bubble({ side, children, time, i }: { side: "in" | "out"; children: React.ReactNode; time: string; i: number }) {
  return (
    <Pop i={i} className={side === "out" ? "flex justify-end" : undefined}>
      <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 text-[0.9rem] leading-snug text-[#111B21] shadow-sm", side === "out" ? "rounded-tr-md bg-[#D9FDD3]" : "rounded-tl-md bg-white")}>
        {children}
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[0.68rem] text-[#44545C]">
          {time}
          {side === "out" && <CheckCheck className="h-3 w-3 text-[#53BDEB]" aria-hidden />}
        </span>
      </div>
    </Pop>
  );
}

function Before() {
  return (
    <div className="space-y-2">
      <Bubble i={0} side="in" time="11:48">¿Qué tienes hoy?</Bubble>
      <Pop i={1} className="flex justify-end">
        <div className="grid w-[52%] grid-cols-2 gap-1 rounded-2xl rounded-tr-md bg-[#D9FDD3] p-1">
          {demoProducts.slice(0, 4).map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-white/50">
              <Image src={p.images[0].url} alt="" fill sizes="120px" loading="eager" className="object-cover" />
            </div>
          ))}
        </div>
      </Pop>
      <Bubble i={2} side="in" time="11:52">¿Y cuánto el brownie?</Bubble>
      <Bubble i={3} side="out" time="11:58">$35 😊</Bubble>
      <Bubble i={4} side="in" time="12:10">¿Todavía hay conchas?</Bubble>
      <Bubble i={5} side="out" time="12:31">Ya no, perdón 🙈</Bubble>
      <Bubble i={6} side="in" time="12:33">Ah ok. Entonces 2 galletas y un café… ¿cuánto sería?</Bubble>
    </div>
  );
}

function After() {
  return (
    <div className="space-y-2">
      <Bubble i={0} side="in" time="11:48">¿Qué tienes hoy?</Bubble>
      <Bubble i={1} side="out" time="11:48">
        Todo está aquí con precio:{" "}
        <span className="font-medium text-[#027EB5] underline underline-offset-2">space.amoxtli.tech/antojos-de-vale</span>
      </Bubble>
      <Pop i={3}>
        <div className="max-w-[82%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-sm">
          <div className="rounded-xl bg-[#F0F2F5] p-3 text-[0.82rem]">
            <p className="font-semibold text-[#111B21]">Antojos de Vale</p>
            <p className="text-[#44545C]">Postres hechos en casa. Mira el catálogo y pide por WhatsApp.</p>
          </div>
          <div className="px-3 py-2 text-[0.9rem] leading-snug text-[#111B21]">
            <p>Hola Antojos de Vale, quiero hacer un pedido:</p>
            <p className="mt-1">• 2 × Galletas con chispas · $50 MXN</p>
            <p>• 1 × Café frío · $45 MXN</p>
            <p className="mt-1 font-semibold">Total aproximado: $95 MXN</p>
            <p>Entrega: Centro, a la 1</p>
            <p className="mt-1 text-[#44545C]">(Pedido armado en Space®)</p>
            <span className="mt-0.5 block text-right text-[0.68rem] text-[#44545C]">11:51</span>
          </div>
        </div>
      </Pop>
      <Bubble i={5} side="out" time="11:52">Listo, a la 1 te veo 👍</Bubble>
    </div>
  );
}

const TABS: { value: Mode; label: string; caption: string }[] = [
  { value: "antes", label: "Por mensajes", caption: "Cuarenta y cinco minutos de ida y vuelta, y todavía sin pedido." },
  { value: "space", label: "Con tu catálogo", caption: "Mismo cliente, mismo pedido: llegó completo a los tres minutos." },
];

export function BeforeAfter() {
  const [mode, setMode] = React.useState<Mode>("antes");
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const seen = useRevealed(ref, "0px 0px -25% 0px");

  return (
    <div ref={ref} className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label="Comparar" className="relative mx-auto flex w-fit rounded-full bg-white p-1 ring-1 ring-ink/10">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            id={`tab-${value}`}
            aria-selected={mode === value}
            aria-controls={`chat-${value}`}
            onClick={() => setMode(value)}
            className={cn("relative z-10 rounded-full px-5 py-2.5 text-sm font-medium transition-colors", mode === value ? "text-white" : "text-ink hover:text-blueInk")}
          >
            {mode === value && (
              <motion.span layoutId="ba-pill" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Los dos paneles comparten la misma celda: la altura es la del más alto y no salta al cambiar. */}
      <div className="mt-6 grid overflow-hidden rounded-3xl bg-[#EFEAE2] ring-1 ring-ink/5">
        {TABS.map(({ value }) => {
          const on = mode === value;
          return (
            <div
              key={value}
              id={`chat-${value}`}
              role="tabpanel"
              aria-labelledby={`tab-${value}`}
              aria-hidden={!on}
              inert={!on}
              data-on={on && seen}
              className={cn("group col-start-1 row-start-1 flex flex-col justify-center p-4 transition-opacity duration-300", on ? "opacity-100" : "pointer-events-none opacity-0")}
            >
              {value === "antes" ? <Before /> : <After />}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid text-center text-sm text-muted-foreground" aria-live="polite">
        {TABS.map(({ value, caption }) => (
          <p key={value} aria-hidden={mode !== value} className={cn("col-start-1 row-start-1 transition-opacity duration-300", mode === value ? "opacity-100" : "opacity-0")}>
            {caption}
          </p>
        ))}
      </div>
    </div>
  );
}
