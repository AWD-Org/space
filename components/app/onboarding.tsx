"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { WordsReveal } from "@/components/landing/motion";
import { checkSlug, createStore, setPublished } from "@/lib/actions/store";
import { normalizeWhatsapp, storeInitials } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { ACCENTS } from "@/lib/validators";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductForm } from "./product-form";
import { StorePreview } from "./store-preview";

const STEPS = ["Tu tienda", "Primer producto", "Publicar"];
const EASE = [0.22, 1, 0.36, 1] as const;

const fieldShell =
  "flex h-12 items-center overflow-hidden rounded-xl border border-input bg-white transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10";

export function Onboarding({
  initialStep,
  host,
  store,
  productCount,
  maxImages,
  categoryLimit,
  categories,
}: {
  initialStep: 1 | 2 | 3;
  host: string;
  store: { name: string; slug: string; whatsapp: string; accent: string } | null;
  productCount: number;
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
  const [accent, setAccent] = React.useState<string>(store?.accent ?? ACCENTS[0].value);
  const [slugState, setSlugState] = React.useState<{ checking: boolean; ok?: boolean; message?: string }>({ checking: false });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState(Boolean(store));

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const whatsappReady = /^52\d{10}$/.test(normalizeWhatsapp(whatsapp));
  const accentLabel = ACCENTS.find((a) => a.value === accent)?.label ?? "";

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
    const res = await createStore({ name, slug: effectiveSlug, whatsapp, accent });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSlug(res.data!.slug);
    setSlugTouched(true);
    setCreated(true);
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

  const item = (i: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 14 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.12 + i * 0.07, ease: EASE },
  });

  const summary = [
    { ok: Boolean(name.trim()), text: name.trim() || "Nombre de tu tienda" },
    { ok: whatsappReady, text: whatsappReady ? "Pedidos a tu WhatsApp" : "WhatsApp sin configurar" },
    { ok: productCount > 0 || step === 3, text: productCount > 0 ? `${productCount} ${productCount === 1 ? "producto" : "productos"}` : "Sin productos todavía" },
  ];

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col bg-white px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between gap-6">
          <SpaceLogo variant="mark" size={28} />
          <ol className="flex flex-1 max-w-sm gap-2" aria-label="Pasos">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1" aria-current={step === i + 1 ? "step" : undefined}>
                <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full origin-left rounded-full bg-blueInk"
                    initial={false}
                    animate={{ scaleX: step > i + 1 ? 1 : step === i + 1 ? 0.5 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
                  />
                </div>
                <span className={cn("mt-2 hidden text-xs sm:block", step === i + 1 ? "font-medium text-ink" : "text-muted-foreground")}>{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {/* Vista previa compacta en pantallas chicas */}
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-spaceMist/70 p-3 lg:hidden" style={{ ["--accent" as string]: accent }}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-500" aria-hidden>
              {name.trim() ? storeInitials(name) : ""}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display font-semibold text-ink">{name.trim() || "El nombre de tu tienda"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {host}/{effectiveSlug || "tu-tienda"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              {step === 1 && (
                <form onSubmit={submitStore} className="space-y-7" noValidate>
                  <div>
                    <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.08] text-ink sm:text-4xl">
                      <WordsReveal text="Empecemos por tu tienda" />
                    </h1>
                    <motion.p {...item(0)} className="mt-3 text-lg leading-relaxed text-muted-foreground">
                      Con esto armamos tu link y tu pedido por WhatsApp. Todo se puede cambiar después.
                    </motion.p>
                  </div>

                  <motion.div {...item(1)}>
                    <Field label="Nombre" htmlFor="o-name" counter={`${name.length}/40`}>
                      <div className={fieldShell}>
                        <input
                          id="o-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={40}
                          placeholder="Ej. Galletas de Dani"
                          autoFocus
                          autoComplete="organization"
                          className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-slate/80 focus:outline-none"
                        />
                      </div>
                    </Field>
                  </motion.div>

                  <motion.div {...item(2)}>
                    <Field
                      label="Tu link"
                      htmlFor="o-slug"
                      error={slugState.ok === false ? slugState.message : null}
                      hint={
                        slugState.checking ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Revisando…
                          </span>
                        ) : slugState.ok ? (
                          <span className="inline-flex items-center gap-1.5 text-[#146C3B]">
                            <Check className="h-3.5 w-3.5" aria-hidden /> Está libre.
                          </span>
                        ) : (
                          "Así lo vas a compartir."
                        )
                      }
                    >
                      <div className={fieldShell}>
                        <span className="pl-4 text-muted-foreground">{host}/</span>
                        <input
                          id="o-slug"
                          value={effectiveSlug}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setSlug(slugify(e.target.value));
                          }}
                          className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base text-ink focus:outline-none"
                          spellCheck={false}
                          autoCapitalize="none"
                        />
                      </div>
                    </Field>
                  </motion.div>

                  <motion.div {...item(3)}>
                    <Field label="WhatsApp para recibir pedidos" htmlFor="o-wa" hint="10 dígitos. Solo lo usamos para armar el botón de pedido.">
                      <div className={fieldShell}>
                        <span className="border-r border-input pl-4 pr-3 text-muted-foreground">+52</span>
                        <input
                          id="o-wa"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="55 1234 5678"
                          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-ink placeholder:text-slate/80 focus:outline-none"
                        />
                        {whatsappReady && <Check className="mr-4 h-4 w-4 text-[#1A8D4A]" aria-label="Número completo" />}
                      </div>
                    </Field>
                  </motion.div>

                  <motion.fieldset {...item(4)} className="space-y-2.5">
                    <legend className="flex w-full items-baseline justify-between text-sm font-medium text-ink">
                      Tu color
                      <span className="font-normal text-muted-foreground">{accentLabel}</span>
                    </legend>
                    <div role="radiogroup" aria-label="Color de tu tienda" className="flex flex-wrap gap-2.5">
                      {ACCENTS.map((a) => {
                        const on = a.value === accent;
                        return (
                          <button
                            key={a.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={a.label}
                            onClick={() => setAccent(a.value)}
                            style={{ backgroundColor: a.value }}
                            className={cn(
                              "grid h-10 w-10 place-items-center rounded-full text-white outline-offset-2 transition-transform duration-200 hover:scale-110 active:scale-95",
                              on && "ring-2 ring-ink ring-offset-2"
                            )}
                          >
                            {on && <Check className="h-4 w-4" aria-hidden />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.fieldset>

                  {error && (
                    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <motion.div {...item(5)}>
                    <Button type="submit" size="lg" className="group h-14 w-full text-base" disabled={busy || name.trim().length < 2 || slugState.ok === false || !whatsappReady}>
                      {busy ? (
                        <>
                          <Loader2 className="animate-spin" aria-hidden /> Creando tu tienda…
                        </>
                      ) : (
                        <>
                          Crear mi tienda
                          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.08] text-ink sm:text-4xl">
                      <WordsReveal text="Sube tu primer producto" />
                    </h1>
                    <motion.p {...item(0)} className="mt-3 text-lg leading-relaxed text-muted-foreground">
                      Una foto, el nombre y el precio. Lo demás, cuando quieras.
                    </motion.p>
                  </div>
                  <motion.div {...item(1)}>
                    <ProductForm compact categories={categories} maxImages={maxImages} categoryLimit={categoryLimit} onSaved={() => setStep(3)} />
                  </motion.div>
                  <button type="button" onClick={() => setStep(3)} className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-ink">
                    Lo hago después
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.08] text-ink sm:text-4xl">
                      <WordsReveal text="Tu catálogo está listo para salir" />
                    </h1>
                    <motion.p {...item(0)} className="mt-3 text-lg leading-relaxed text-muted-foreground">
                      Al publicarlo, cualquiera con tu link puede verlo y mandarte pedidos. Lo puedes ocultar cuando quieras.
                    </motion.p>
                  </div>

                  <motion.div {...item(1)} className="rounded-2xl bg-cloud p-5">
                    <p className="text-sm text-muted-foreground">Tu link</p>
                    <p className="mt-1 break-all font-display text-xl font-semibold text-ink">
                      {host}/{slug}
                    </p>
                    <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-[0.95rem]">
                      {summary.map((s) => (
                        <li key={s.text} className="flex items-center gap-2.5">
                          <span className={cn("grid h-5 w-5 place-items-center rounded-full", s.ok ? "bg-[#1A8D4A] text-white" : "bg-ink/10 text-transparent")}>
                            <Check className="h-3 w-3" aria-hidden />
                          </span>
                          <span className={s.ok ? "text-ink" : "text-muted-foreground"}>{s.text}</span>
                        </li>
                      ))}
                    </ul>
                    <a href={`/${slug}`} target="_blank" rel="noopener" className="mt-4 inline-block text-sm font-medium text-blueInk underline-offset-4 hover:underline lg:hidden">
                      Ver cómo se ve antes
                    </a>
                  </motion.div>

                  <motion.div {...item(2)} className="space-y-2">
                    <Button size="lg" className="group h-14 w-full text-base" onClick={publish} disabled={busy}>
                      {busy ? (
                        <>
                          <Loader2 className="animate-spin" aria-hidden /> Publicando…
                        </>
                      ) : (
                        <>
                          Publicar mi catálogo
                          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                        </>
                      )}
                    </Button>
                    <Link href="/app" className="block w-full py-2 text-center text-sm text-muted-foreground transition-colors hover:text-ink">
                      Prefiero revisarlo primero en el panel
                    </Link>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <StorePreview step={step} name={name} slug={effectiveSlug} host={host} accent={accent} whatsappReady={whatsappReady} liveSlug={created && slug ? slug : undefined} />
    </div>
  );
}
