"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { changeSlug, setPublished, updateStore } from "@/lib/actions/store";
import { uploadImage } from "@/lib/client/upload";
import { PAYMENT_LABEL, normalizeWhatsapp, prettyWhatsapp } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { ColorPicker } from "./color-picker";
import type { PaymentMethod, Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "./shell";

export function StoreSettings({ store, host, slugDays }: { store: Store; host: string; slugDays: number }) {
  const router = useRouter();
  const [name, setName] = React.useState(store.name);
  const [tagline, setTagline] = React.useState(store.tagline);
  const [whatsapp, setWhatsapp] = React.useState(prettyWhatsapp(store.whatsapp));
  const [deliveryNote, setDeliveryNote] = React.useState(store.deliveryNote);
  const [payments, setPayments] = React.useState<PaymentMethod[]>(store.paymentMethods);
  const [accent, setAccent] = React.useState(store.accent);
  const [slug, setSlug] = React.useState(store.slug);
  const [logoBusy, setLogoBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const logoInput = React.useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const snapshot = (v: { name: string; tagline: string; whatsapp: string; deliveryNote: string; payments: PaymentMethod[]; accent: string }) =>
    JSON.stringify({ ...v, whatsapp: normalizeWhatsapp(v.whatsapp), name: v.name.trim(), tagline: v.tagline.trim(), deliveryNote: v.deliveryNote.trim(), payments: [...v.payments].sort(), accent: v.accent.toUpperCase() });
  const [baseline, setBaseline] = React.useState(() =>
    snapshot({ name: store.name, tagline: store.tagline, whatsapp: prettyWhatsapp(store.whatsapp), deliveryNote: store.deliveryNote, payments: store.paymentMethods, accent: store.accent })
  );
  const dirty = snapshot({ name, tagline, whatsapp, deliveryNote, payments, accent }) !== baseline;

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function discard() {
    const b = JSON.parse(baseline) as { name: string; tagline: string; deliveryNote: string; payments: PaymentMethod[]; accent: string };
    setName(b.name);
    setTagline(b.tagline);
    setWhatsapp(prettyWhatsapp(store.whatsapp));
    setDeliveryNote(b.deliveryNote);
    setPayments(b.payments);
    setAccent(b.accent);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateStore({ name, tagline, whatsapp, deliveryNote, paymentMethods: payments, accent });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    setBaseline(snapshot({ name, tagline, whatsapp, deliveryNote, payments, accent }));
    toast.success("Tu tienda quedó actualizada.");
    router.refresh();
  }

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
      <form onSubmit={save} className="grid gap-4">
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
            <Field label="Nombre de tu tienda" htmlFor="s-name" counter={`${name.length}/40`}>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </Field>
            <Field label="Frase corta" htmlFor="s-tag" counter={`${tagline.length}/120`} hint="Qué vendes, en una línea. Sale debajo de tu nombre.">
              <Textarea id="s-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} className="min-h-[72px]" placeholder="Ej. Postres hechos en casa, pedidos con un día de anticipación" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Color de tu catálogo</p>
              <ColorPicker value={accent} onChange={setAccent} label="Color de tu catálogo" />
            </div>
          </div>
        </Panel>

        <Panel title="Pedidos y entrega">
          <div className="grid gap-4">
            <Field label="WhatsApp para pedidos" htmlFor="s-wa" hint="10 dígitos. Ahí te llegan los pedidos.">
              <Input id="s-wa" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="55 1234 5678" />
            </Field>
            <Field label="Dónde y cuándo entregas" htmlFor="s-del" counter={`${deliveryNote.length}/160`}>
              <Input id="s-del" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} maxLength={160} placeholder="Ej. Entrego en el centro, de 12 a 3" />
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
                      onClick={() => setPayments((p) => (on ? p.filter((x) => x !== m) : [...p, m]))}
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

        <AnimatePresence>
          {dirty && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-40 px-4 sm:px-6 lg:bottom-6 lg:left-[248px] lg:px-10"
            >
              <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-white shadow-xl shadow-black/20" role="region" aria-label="Cambios sin guardar">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#F2A93B]" aria-hidden />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  <span className="sm:hidden">Sin guardar</span>
                  <span className="hidden sm:inline">Tienes cambios sin guardar</span>
                </p>
                <button type="button" onClick={discard} disabled={saving} className="rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white disabled:opacity-50">
                  Descartar
                </button>
                <Button type="submit" size="sm" className="h-10 bg-white px-5 text-ink hover:bg-spaceMist" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden /> Guardando…
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <Panel title="Tu link" description={store.status === "published" ? `Si lo cambias, el anterior deja de funcionar y no podrás cambiarlo otra vez en ${slugDays} días.` : "Puedes cambiarlo libremente mientras no publiques."}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-12 w-full items-center overflow-hidden rounded-xl border sm:flex-1 border-input bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <span className="hidden pl-4 text-muted-foreground sm:inline">{host}/</span>
            <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} aria-label="Link de tu catálogo" className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-ink focus:outline-none sm:pl-0" />
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
