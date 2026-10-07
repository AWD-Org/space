"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { checkSlug, createStore, setPublished } from "@/lib/actions/store";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductForm } from "./product-form";

const STEPS = ["Tu tienda", "Primer producto", "Publicar"];

export function Onboarding({
  initialStep,
  host,
  store,
  maxImages,
  categoryLimit,
  categories,
}: {
  initialStep: 1 | 2 | 3;
  host: string;
  store: { name: string; slug: string; whatsapp: string } | null;
  maxImages: number;
  categoryLimit: number;
  categories: Category[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(initialStep);
  const [name, setName] = React.useState(store?.name ?? "");
  const [slug, setSlug] = React.useState(store?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(store));
  const [whatsapp, setWhatsapp] = React.useState(store?.whatsapp ? store.whatsapp.slice(2) : "");
  const [slugState, setSlugState] = React.useState<{ checking: boolean; ok?: boolean; message?: string }>({ checking: false });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  React.useEffect(() => {
    if (!effectiveSlug || effectiveSlug.length < 3) {
      setSlugState({ checking: false });
      return;
    }
    setSlugState({ checking: true });
    const t = setTimeout(async () => {
      try {
        const res = await checkSlug(effectiveSlug);
        setSlugState({ checking: false, ok: res.available, message: res.message });
      } catch {
        setSlugState({ checking: false });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [effectiveSlug]);

  async function submitStore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await createStore({ name, slug: effectiveSlug, whatsapp });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSlug(res.data!.slug);
    setSlugTouched(true);
    setStep(2);
  }

  async function publish() {
    setBusy(true);
    const res = await setPublished(true);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    router.push("/app/compartir");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-10 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <SpaceLogo variant="mark" size={26} />
        <ol className="flex items-center gap-2 text-sm" aria-label="Pasos">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2" aria-current={step === i + 1 ? "step" : undefined}>
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
                  step > i + 1 ? "bg-[#1A8D4A] text-white" : step === i + 1 ? "bg-ink text-white" : "bg-white text-muted-foreground ring-1 ring-border"
                )}
              >
                {step > i + 1 ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn("hidden sm:inline", step === i + 1 ? "font-medium text-ink" : "text-muted-foreground")}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mt-10 flex-1"
        >
          {step === 1 && (
            <form onSubmit={submitStore} className="space-y-6" noValidate>
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">¿Cómo se llama tu tienda?</h1>
                <p className="mt-2 text-muted-foreground">Puede ser tu nombre o el de tu marca. Lo cambias cuando quieras.</p>
              </div>
              <Field label="Nombre" htmlFor="o-name">
                <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ej. Galletas de Dani" autoFocus />
              </Field>
              <Field
                label="Tu link"
                htmlFor="o-slug"
                error={slugState.ok === false ? slugState.message : null}
                hint={
                  slugState.checking ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Revisando…
                    </span>
                  ) : slugState.ok ? (
                    <span className="text-[#146C3B]">Está libre.</span>
                  ) : (
                    "Así lo vas a compartir."
                  )
                }
              >
                <div className="flex h-12 items-center overflow-hidden rounded-xl border border-input bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                  <span className="pl-4 text-muted-foreground">{host}/</span>
                  <input
                    id="o-slug"
                    value={effectiveSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base text-ink focus:outline-none"
                  />
                </div>
              </Field>
              <Field label="WhatsApp para recibir pedidos" htmlFor="o-wa" hint="10 dígitos. No se muestra hasta que alguien te escribe.">
                <Input id="o-wa" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="55 1234 5678" />
              </Field>
              {error && (
                <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={busy || name.trim().length < 2 || slugState.ok === false}>
                {busy ? "Creando…" : "Seguir"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">Sube tu primer producto</h1>
                <p className="mt-2 text-muted-foreground">Una foto, el nombre y el precio. La descripción y lo demás, después.</p>
              </div>
              <ProductForm compact categories={categories} maxImages={maxImages} categoryLimit={categoryLimit} onSaved={() => setStep(3)} />
              <button type="button" onClick={() => setStep(3)} className="w-full py-2 text-sm text-muted-foreground hover:text-ink">
                Lo hago después
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">Tu catálogo está listo para salir</h1>
                <p className="mt-2 text-muted-foreground">
                  Al publicarlo, cualquiera con tu link puede verlo y mandarte pedidos. Puedes ocultarlo cuando quieras.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                <p className="text-sm text-muted-foreground">Tu link</p>
                <p className="mt-1 break-all font-display text-xl font-semibold text-ink">
                  {host}/{slug}
                </p>
                <a href={`/${slug}`} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-medium text-blueInk underline-offset-4 hover:underline">
                  Ver cómo se ve antes
                </a>
              </div>
              <Button size="lg" className="w-full" onClick={publish} disabled={busy}>
                {busy ? "Publicando…" : "Publicar mi catálogo"}
              </Button>
              <Link href="/app" className="block w-full py-2 text-center text-sm text-muted-foreground hover:text-ink">
                Prefiero revisarlo primero en el panel
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
