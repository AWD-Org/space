"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { safe } from "@/lib/client/safe-action";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneInput } from "@/components/ui/phone-input";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { WordsReveal } from "@/components/landing/motion";
import { checkSlug, createStore, setPublished } from "@/lib/actions/store";
import { signOut } from "@/lib/firebase/client";
import { storeInitials } from "@/lib/format";
import { slugify, slugifyInput } from "@/lib/slug";
import { ACCENTS, onboardingFormSchema, type OnboardingFormValues } from "@/lib/validators";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./color-picker";
import { ProductForm } from "./product-form";
import { StorePreview } from "./store-preview";

const STEPS = ["Tu tienda", "Primer producto", "Publicar"];
const PUBLISH_STEPS = ["Guardando tu tienda", "Armando tu link", "Acomodando tus productos", "Publicando tu catálogo", "Abriendo tu espacio"];
const EASE = [0.22, 1, 0.36, 1] as const;

const fieldShell =
  "flex h-12 items-center overflow-hidden rounded-xl border border-input bg-white transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:focus-within:ring-destructive/10";

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
  const [slugTouched, setSlugTouched] = React.useState(Boolean(store));
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError: setFieldError,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: store?.name ?? "",
      slug: store?.slug ?? "",
      whatsapp: store?.whatsapp ? store.whatsapp.slice(2) : "",
      accent: store?.accent ?? ACCENTS[0].value,
    },
  });
  const name = watch("name");
  const effectiveSlug = watch("slug");
  const whatsapp = watch("whatsapp");
  const accent = watch("accent");
  const [slugState, setSlugState] = React.useState<{ checking: boolean; ok?: boolean; message?: string }>({ checking: false });
  const [busy, setBusy] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState(Boolean(store));

  const whatsappReady = /^\d{10}$/.test(whatsapp);
  const accentLabel = ACCENTS.find((a) => a.value.toLowerCase() === accent.toLowerCase())?.label ?? "Personalizado";

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

  const submitStore = handleSubmit(
    async (v) => {
      setError(null);
      if (slugState.checking) return toast.info("Estamos revisando tu link. Un segundo.");
      if (slugState.ok === false) {
        setFieldError("slug", { message: slugState.message ?? "Ese link ya está ocupado. Prueba otro." }, { shouldFocus: true });
        return;
      }
      setBusy(true);
      const res = await safe(() => createStore({ name: v.name, slug: v.slug, whatsapp: v.whatsapp, accent: v.accent }));
      setBusy(false);
      if (!res.ok) return setError(res.error);
      setValue("slug", res.data!.slug);
      setSlugTouched(true);
      setCreated(true);
      setStep(2);
    },
    () => {
      setError(null);
      toast.warning("Completa los campos marcados para seguir.");
    }
  );

  async function publish() {
    setBusy(true);
    setPublishing(true);
    toast.dismiss();
    const started = Date.now();
    const res = await safe(() => setPublished(true));
    if (!res.ok) {
      setBusy(false);
      setPublishing(false);
      return toast.error(res.error);
    }
    // Deja ver los pasos completos antes de abrir el panel.
    await new Promise((r) => setTimeout(r, Math.max(0, 3300 - (Date.now() - started))));
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
        <div className="flex items-center justify-between">
          <SpaceLogo variant="mark" size={28} />
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/entrar");
              router.refresh();
            }}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-cloud hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Salir
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <ol className="mb-10 flex w-full gap-2" aria-label="Pasos">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1" aria-current={step === i + 1 ? "step" : undefined}>
                <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full origin-left rounded-full bg-blueInk"
                    initial={false}
                    animate={{ scaleX: step >= i + 1 ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
                  />
                </div>
                <span className={cn("mt-2 hidden text-xs sm:block", step === i + 1 ? "font-medium text-ink" : "text-muted-foreground")}>{label}</span>
              </li>
            ))}
          </ol>
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
                    <Field label="Nombre" htmlFor="o-name" counter={`${name.length}/40`} error={errors.name?.message}>
                      <div className={fieldShell}>
                        <input
                          id="o-name"
                          {...register("name", { onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value), { shouldValidate: Boolean(errors.slug) }) })}
                          aria-invalid={!!errors.name}
                          maxLength={40}
                          placeholder="Ej. Galletas de Dani"
                          autoFocus
                          autoComplete="organization"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-slate/80 focus:outline-none"
                        />
                      </div>
                    </Field>
                  </motion.div>

                  <motion.div {...item(2)}>
                    <Field
                      label="Tu link"
                      htmlFor="o-slug"
                      error={errors.slug?.message ?? (slugState.ok === false ? slugState.message : null)}
                      hint={
                        slugState.checking ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5 rounded-full" /> Revisando tu link…
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
                          {...register("slug", {
                            onChange: (e) => {
                              setSlugTouched(true);
                              setValue("slug", slugifyInput(e.target.value), { shouldValidate: true });
                            },
                            onBlur: (e) => setValue("slug", slugify(e.target.value), { shouldValidate: true }),
                          })}
                          aria-invalid={!!errors.slug || slugState.ok === false}
                          inputMode="url"
                          autoCorrect="off"
                          enterKeyHint="next"
                          className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base text-ink focus:outline-none"
                          spellCheck={false}
                          autoCapitalize="none"
                        />
                      </div>
                    </Field>
                  </motion.div>

                  <motion.div {...item(3)}>
                    <Field label="WhatsApp para recibir pedidos" htmlFor="o-wa" error={errors.whatsapp?.message} hint="10 dígitos, sin espacios. Solo lo usamos para armar el botón de pedido.">
                      <Controller
                        control={control}
                        name="whatsapp"
                        render={({ field }) => <PhoneInput id="o-wa" ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.whatsapp} />}
                      />
                    </Field>
                  </motion.div>

                  <motion.fieldset {...item(4)} className="space-y-2.5">
                    <legend className="flex w-full items-baseline justify-between text-sm font-medium text-ink">
                      Tu color
                      <span className="font-normal text-muted-foreground">{accentLabel}</span>
                    </legend>
                    <ColorPicker value={accent} onChange={(v) => setValue("accent", v, { shouldValidate: true })} />
                  </motion.fieldset>

                  {error && (
                    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <motion.div {...item(5)}>
                    <Button type="submit" size="lg" className="group h-14 w-full text-base" loading={busy} loadingText="Creando tu tienda…">
                      Crear mi tienda
                      <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
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
                      {host}/{effectiveSlug}
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
                    <a href={`/${effectiveSlug}`} target="_blank" rel="noopener" className="mt-4 inline-block text-sm font-medium text-blueInk underline-offset-4 hover:underline lg:hidden">
                      Ver cómo se ve antes
                    </a>
                  </motion.div>

                  <motion.div {...item(2)} className="space-y-2">
                    <Button size="lg" className="group h-14 w-full text-base" onClick={publish} loading={busy} loadingText="Publicando…">
                      Publicar mi catálogo
                      <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
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

      <MultiStepLoader steps={PUBLISH_STEPS} loading={publishing} />
      <StorePreview step={step} name={name} slug={effectiveSlug} host={host} accent={accent} whatsappReady={whatsappReady} liveSlug={created && effectiveSlug ? effectiveSlug : undefined} />
    </div>
  );
}
