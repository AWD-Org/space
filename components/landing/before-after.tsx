"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { demoProducts } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Mode = "antes" | "space";

function Bubble({ side, children, time }: { side: "in" | "out"; children: React.ReactNode; time: string }) {
  return (
    <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 text-[0.9rem] leading-snug text-[#111B21] shadow-sm", side === "out" ? "ml-auto rounded-tr-md bg-[#D9FDD3]" : "rounded-tl-md bg-white")}>
      {children}
      <span className="mt-0.5 flex items-center justify-end gap-1 text-[0.68rem] text-[#54656F]">
        {time}
        {side === "out" && <CheckCheck className="h-3 w-3 text-[#53BDEB]" aria-hidden />}
      </span>
    </div>
  );
}

function Before() {
  return (
    <div className="space-y-2">
      <Bubble side="in" time="11:48">¿Qué tienes hoy?</Bubble>
      <div className="ml-auto grid w-[52%] grid-cols-2 gap-1 rounded-2xl rounded-tr-md bg-[#D9FDD3] p-1">
        {demoProducts.slice(0, 4).map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-white/50">
            <Image src={p.images[0].url} alt="" fill sizes="120px" loading="eager" className="object-cover" />
          </div>
        ))}
      </div>
      <Bubble side="in" time="11:52">¿Y cuánto el brownie?</Bubble>
      <Bubble side="out" time="11:58">$35 😊</Bubble>
      <Bubble side="in" time="12:10">¿Todavía hay conchas?</Bubble>
      <Bubble side="out" time="12:31">Ya no, perdón 🙈</Bubble>
      <Bubble side="in" time="12:33">Ah ok. Entonces 2 galletas y un café… ¿cuánto sería?</Bubble>
    </div>
  );
}

function After() {
  return (
    <div className="space-y-2">
      <Bubble side="in" time="11:48">¿Qué tienes hoy?</Bubble>
      <Bubble side="out" time="11:48">
        Todo está aquí con precio:{" "}
        <span className="font-medium text-[#027EB5] underline underline-offset-2">space.amoxtli.tech/antojos-de-vale</span>
      </Bubble>
      <div className="max-w-[82%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-sm">
        <div className="rounded-xl bg-[#F0F2F5] p-3 text-[0.82rem]">
          <p className="font-semibold text-[#111B21]">Antojos de Vale</p>
          <p className="text-[#54656F]">Postres hechos en casa. Mira el catálogo y pide por WhatsApp.</p>
        </div>
        <div className="px-3 py-2 text-[0.9rem] leading-snug text-[#111B21]">
          <p>Hola Antojos de Vale, quiero hacer un pedido:</p>
          <p className="mt-1">• 2 × Galletas con chispas · $50</p>
          <p>• 1 × Café frío · $45</p>
          <p className="mt-1 font-semibold">Total aproximado: $95</p>
          <p>Entrega: Explanada a la 1</p>
          <span className="mt-0.5 block text-right text-[0.68rem] text-[#54656F]">11:51</span>
        </div>
      </div>
      <Bubble side="out" time="11:52">Listo, a la 1 te veo 👍</Bubble>
    </div>
  );
}

export function BeforeAfter() {
  const [mode, setMode] = React.useState<Mode>("antes");
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label="Comparar" className="relative mx-auto flex w-fit rounded-full bg-white p-1 ring-1 ring-ink/10">
        {(
          [
            ["antes", "Por mensajes"],
            ["space", "Con tu catálogo"],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            aria-controls="chat-panel"
            onClick={() => setMode(value)}
            className={cn("relative z-10 rounded-full px-5 py-2.5 text-sm font-medium transition-colors", mode === value ? "text-white" : "text-ink")}
          >
            {mode === value && (
              <motion.span layoutId="ba-pill" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} />
            )}
            {label}
          </button>
        ))}
      </div>
      <div id="chat-panel" role="tabpanel" className="mt-6 min-h-[520px] overflow-hidden rounded-3xl bg-[#EFEAE2] p-4 ring-1 ring-ink/5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            {mode === "antes" ? <Before /> : <After />}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">{mode === "antes" ? "45 minutos y todavía no hay pedido." : "El mismo pedido, en tres minutos y con total."}</p>
    </div>
  );
}
