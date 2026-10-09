"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { storeInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Tienda en construcción: se actualiza mientras la persona escribe. */
function Sketch({ name, slug, host, accent, whatsappReady, highlightFirst }: { name: string; slug: string; host: string; accent: string; whatsappReady: boolean; highlightFirst: boolean }) {
  const shown = name.trim();
  return (
    <div style={{ ["--accent" as string]: accent }} className="h-full bg-white px-3.5 pt-11">
      <div className="flex items-center gap-2.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-500" aria-hidden>
          {shown ? storeInitials(shown) : ""}
        </div>
        <div className="min-w-0">
          <p className={cn("truncate font-display text-[1.05rem] font-semibold leading-tight transition-colors", shown ? "text-ink" : "text-slate/60")}>{shown || "El nombre de tu tienda"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {host}/{slug || "tu-tienda"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EE] px-2 py-1 font-medium text-[#146C3B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1A8D4A]" aria-hidden />
          Tomando pedidos
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors duration-300", whatsappReady ? "bg-cloud text-ink" : "bg-cloud/60 text-slate/60")}>
          <MessageCircle className="h-3 w-3" aria-hidden />
          {whatsappReady ? "Pedidos por WhatsApp" : "Tu WhatsApp"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-2xl transition-[box-shadow,background-color] duration-500",
                i === 0 && highlightFirst ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""
              )}
              style={{ backgroundColor: `color-mix(in srgb, ${accent} ${i === 0 && highlightFirst ? 16 : 9}%, white)` }}
            >
              {i === 0 && highlightFirst && (
                <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs font-medium text-[var(--accent)]">Tu primer producto va aquí</span>
              )}
            </div>
            <div className="mt-2 h-2.5 w-4/5 rounded-full bg-ink/10" />
            <div className="mt-1.5 h-2.5 w-2/5 rounded-full bg-ink/10" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-3 bottom-4 flex h-11 items-center rounded-full bg-[var(--accent)] pl-4 pr-1.5 text-sm text-white transition-colors duration-500">
        <span className="font-medium">Ver pedido</span>
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1.5 font-semibold">$0</span>
      </div>
    </div>
  );
}

export function StorePreview({
  step,
  name,
  slug,
  host,
  accent,
  whatsappReady,
  liveSlug,
}: {
  step: 1 | 2 | 3;
  name: string;
  slug: string;
  host: string;
  accent: string;
  whatsappReady: boolean;
  /** Con el catálogo ya creado, el paso 3 muestra la página real. */
  liveSlug?: string;
}) {
  const reduce = useReducedMotion();
  const [frameReady, setFrameReady] = React.useState(false);
  const caption = step === 1 ? "Así va quedando tu tienda" : step === 2 ? "Tus productos aparecen aquí" : "Esto es lo que verán tus clientes";
  return (
    <div className="relative hidden overflow-hidden bg-spaceMist lg:block" aria-hidden={step !== 3}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 opacity-[0.14]"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, ease: "linear", repeat: Infinity }}
      >
        <SpaceLogo variant="mark" size={560} />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-16 opacity-50"
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
      >
        <SpaceLogo variant="mark" size={96} />
      </motion.div>

      <div className="relative flex h-full min-h-dvh flex-col items-center justify-center gap-6 px-8 py-10">
        <PhoneFrame label="Vista previa de tu catálogo">
          {step === 3 && liveSlug ? (
            <>
            {!frameReady && <div className="skeleton-img absolute inset-0" aria-hidden />}
            <iframe
              onLoad={() => setFrameReady(true)}
              src={`/${liveSlug}`}
              title="Vista previa de tu catálogo"
              className="absolute left-0 top-[18px] h-[810px] w-[390px] origin-top-left border-0 bg-white"
              style={{ transform: "scale(0.718)" }}
              loading="lazy"
            />
            </>
          ) : (
            <Sketch name={name} slug={slug} host={host} accent={accent} whatsappReady={whatsappReady} highlightFirst={step === 2} />
          )}
        </PhoneFrame>
        <p className="flex items-center gap-2 text-sm font-medium text-ink/80">
          {step === 3 && <Check className="h-4 w-4 text-[#1A8D4A]" aria-hidden />}
          {caption}
        </p>
      </div>
    </div>
  );
}
