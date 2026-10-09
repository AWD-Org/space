"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { SaveBar } from "./save-bar";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { changeSlug, setPublished, updateStore } from "@/lib/actions/store";
import { uploadImage } from "@/lib/client/upload";
import { PAYMENT_LABEL, prettyWhatsapp } from "@/lib/format";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/validators";
import { slugify } from "@/lib/slug";
import { ColorPicker } from "./color-picker";
import type { PaymentMethod, Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "./shell";

export function StoreSettings({ store, host, slugDays }: { store: Store; host: string; slugDays: number }) {
  const router = useRouter();
  const [slug, setSlug] = React.useState(store.slug);
  const [logoBusy, setLogoBusy] = React.useState(false);
  const logoInput = React.useRef<HTMLInputElement>(null);
  const initial = React.useMemo<SettingsFormValues>(
    () => ({
      name: store.name,
      tagline: store.tagline,
      whatsapp: prettyWhatsapp(store.whatsapp),
      deliveryNote: store.deliveryNote,
      paymentMethods: [...store.paymentMethods],
      accent: store.accent,
    }),
    [store]
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsFormSchema), mode: "onTouched", defaultValues: initial });
  const name = watch("name");
  const tagline = watch("tagline");
  const deliveryNote = watch("deliveryNote");
  const payments = watch("paymentMethods");
  const accent = watch("accent");

  const save = handleSubmit(
    async (v) => {
      const res = await updateStore({ ...v, paymentMethods: v.paymentMethods });
      if (!res.ok) return toast.error(res.error);
      reset(v);
      toast.success("Tu tienda quedó actualizada.");
      router.refresh();
    },
    () => toast.warning("Revisa los campos marcados en rojo.")
  );

  async function saveSlug() {
    const res = await changeSlug(slug);
    if (!res.ok) return toast.error(res.error);
    setSlug(res.data!.slug);
    toast.success("Tu link cambió. Comparte el nuevo.");
    router.refresh();
  }

  async function onLogo(file?: File) {
    if (!file) return;
    setLogoBusy(true);
    try {
      await uploadImage(file, "logo");
      toast.success("Logo actualizado.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el logo.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function togglePublished() {
    const res = await setPublished(store.status !== "published");
    if (!res.ok) return toast.error(res.error);
    toast.success(store.status === "published" ? "Tu catálogo quedó oculto." : "Tu catálogo ya está en línea.");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={save} className="grid gap-4" noValidate>
        <Panel title="Cómo te ven">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-white"
              style={{ background: accent }}
              aria-label="Cambiar logo"
            >
              {store.logo && <Image src={store.logo.url} alt={`Logo de ${store.name}`} fill sizes="80px" className="object-cover" />}
              <span className="absolute inset-0 grid place-items-center bg-ink/30 opacity-0 transition-opacity hover:opacity-100">
                {logoBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </span>
              {!store.logo && !logoBusy && <Camera className="h-6 w-6" aria-hidden />}
            </button>
            <div>
              <p className="font-medium text-ink">Logo o foto</p>
              <p className="text-sm text-muted-foreground">Cuadrada se ve mejor. Puede ser tu logo o una foto tuya.</p>
            </div>
            <input ref={logoInput} type="file" accept="image/*" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} tabIndex={-1} aria-hidden />
          </div>

          <div className="mt-6 grid gap-4">
            <Field label="Nombre de tu tienda" htmlFor="s-name" counter={`${name.length}/40`} error={errors.name?.message}>
              <Input id="s-name" {...register("name")} aria-invalid={!!errors.name} maxLength={40} autoCapitalize="words" enterKeyHint="next" />
            </Field>
            <Field label="Frase corta" htmlFor="s-tag" counter={`${tagline.length}/120`} error={errors.tagline?.message} hint="Qué vendes, en una línea. Sale debajo de tu nombre.">
              <Textarea id="s-tag" enterKeyHint="enter" autoCapitalize="sentences" {...register("tagline")} aria-invalid={!!errors.tagline} maxLength={120} className="min-h-[72px]" placeholder="Ej. Postres hechos en casa, pedidos con un día de anticipación" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Color de tu catálogo</p>
              <ColorPicker value={accent} onChange={(v) => setValue("accent", v, { shouldDirty: true, shouldValidate: true })} label="Color de tu catálogo" />
              {errors.accent && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.accent.message}</p>}
            </div>
          </div>
        </Panel>

        <Panel title="Pedidos y entrega">
          <div className="grid gap-4">
            <Field label="WhatsApp para pedidos" htmlFor="s-wa" error={errors.whatsapp?.message} hint="10 dígitos, sin espacios. Ahí te llegan los pedidos.">
              <Controller control={control} name="whatsapp" render={({ field }) => <PhoneInput id="s-wa" ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.whatsapp} />} />
            </Field>
            <Field label="Dónde y cuándo entregas" htmlFor="s-del" counter={`${deliveryNote.length}/160`} error={errors.deliveryNote?.message}>
              <Input id="s-del" {...register("deliveryNote")} aria-invalid={!!errors.deliveryNote} maxLength={160} autoCapitalize="sentences" enterKeyHint="next" placeholder="Ej. Entrego en el centro, de 12 a 3" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Cómo te pagan</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => {
                  const on = payments.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setValue("paymentMethods", on ? payments.filter((x) => x !== m) : [...payments, m], { shouldDirty: true })}
                      className={cn("rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors", on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-border hover:bg-cloud")}
                    >
                      {PAYMENT_LABEL[m]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Solo es informativo. El cobro lo acuerdas tú por WhatsApp.</p>
            </div>
          </div>
        </Panel>

        <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => reset(initial)} />
      </form>

      <Panel title="Tu link" description={store.status === "published" ? `Si lo cambias, el anterior deja de funcionar y no podrás cambiarlo otra vez en ${slugDays} días.` : "Puedes cambiarlo libremente mientras no publiques."}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-12 w-full items-center overflow-hidden rounded-xl border sm:flex-1 border-input bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <span className="hidden pl-4 text-muted-foreground sm:inline">{host}/</span>
            <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} aria-label="Link de tu catálogo" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-ink focus:outline-none sm:pl-0" />
          </div>
          <Button type="button" variant="secondary" size="lg" disabled={slug === store.slug} onClick={saveSlug}>
            Cambiar link
          </Button>
        </div>
      </Panel>

      <Panel title={store.status === "published" ? "Catálogo en línea" : "Catálogo en borrador"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-muted-foreground">
            {store.status === "published" ? "Cualquiera con tu link puede verlo. Si lo ocultas, el link muestra que no está disponible." : "Solo tú puedes verlo. Publícalo cuando tengas tus productos listos."}
          </p>
          <Button type="button" variant={store.status === "published" ? "secondary" : "primary"} onClick={togglePublished}>
            {store.status === "published" ? "Ocultar catálogo" : "Publicar catálogo"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
