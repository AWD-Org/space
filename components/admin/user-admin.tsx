"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useReauth } from "@/components/admin/reauth";
import { setLimits, setStoreState, setSubscription } from "@/lib/actions/admin";
import { PLAN_OPTIONS, STATUS_LABEL } from "@/lib/admin-labels";
import { toast } from "@/lib/toast";
import type { SubscriptionStatus } from "@/lib/types";

export type AdminUser = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  isOpen: boolean;
  planName: string;
  subStatus: SubscriptionStatus;
  renewsOn: string;
  amount: string;
  note: string;
  billing: "" | "monthly" | "annual";
  courtesy: boolean;
  /** Fin de la pausa pedida por el dueño (ms), si sigue vigente. */
  pausedUntil: number | null;
  limits: { products: string; categories: string; imagesPerProduct: string };
};

/** Edición de la suscripción y del estado de una tienda, desde la tabla de usuarios. */
export function UserAdmin({ u }: { u: AdminUser }) {
  const router = useRouter();
  const { guarded, dialog } = useReauth();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [f, setF] = React.useState({ planName: u.planName, status: u.subStatus, renewsOn: u.renewsOn, amount: u.amount, note: u.note, billing: u.billing, courtesy: u.courtesy });
  const [lim, setLim] = React.useState(u.limits);
  const [confirm, setConfirm] = React.useState(false);
  const setL = (k: keyof typeof lim) => (e: React.ChangeEvent<HTMLInputElement>) => setLim((p) => ({ ...p, [k]: e.target.value.replace(/\D/g, "") }));
  const set = (k: "planName" | "status" | "renewsOn" | "amount" | "note" | "billing") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    const res = await guarded(() => setSubscription(u.id, f));
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Suscripción guardada.");
    router.refresh();
  }

  async function saveLimits() {
    setBusy(true);
    const res = await guarded(() => setLimits(u.id, lim));
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Límites guardados.");
    router.refresh();
  }

  async function state(patch: { status?: "draft" | "published"; isOpen?: boolean; resumePause?: boolean }, msg: string): Promise<void> {
    setBusy(true);
    const res = await guarded(() => setStoreState(u.id, patch));
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(msg);
    router.refresh();
  }

  return (
    <div>
      <Button variant="soft" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Administrar ${u.name}`}>
        {open ? "Cerrar" : "Administrar"}
      </Button>
      {open && (
        <div className="mt-3 space-y-4 rounded-2xl bg-cloud/60 p-4 text-left">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Plan" htmlFor={`plan-${u.id}`}>
              <Select id={`plan-${u.id}`} value={f.planName} onChange={set("planName")}>
                {!(PLAN_OPTIONS as readonly string[]).includes(f.planName) && <option value={f.planName}>{f.planName}</option>}
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado" htmlFor={`st-${u.id}`}>
              <Select id={`st-${u.id}`} value={f.status} onChange={set("status")}>
                {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((k) => (
                  <option key={k} value={k}>{STATUS_LABEL[k]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Periodo" htmlFor={`bil-${u.id}`}>
              <Select id={`bil-${u.id}`} value={f.billing} onChange={set("billing")}>
                <option value="">Sin definir</option>
                <option value="monthly">Mensual</option>
                <option value="annual">Anual</option>
              </Select>
            </Field>
            <Field label="Próxima renovación" htmlFor={`ren-${u.id}`}>
              <Input id={`ren-${u.id}`} type="date" value={f.renewsOn} onChange={set("renewsOn")} />
            </Field>
            <Field label="Monto por periodo (MXN)" htmlFor={`amt-${u.id}`}>
              <Input id={`amt-${u.id}`} inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="0" />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input type="checkbox" className="h-5 w-5 rounded border-input accent-primary" checked={f.courtesy} onChange={(e) => setF((p) => ({ ...p, courtesy: e.target.checked }))} />
            Cuenta de cortesía (sin cobro; no cuenta en el ingreso)
          </label>
          <Field label="Nota interna" htmlFor={`note-${u.id}`}>
            <Input id={`note-${u.id}`} value={f.note} onChange={set("note")} maxLength={300} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>Guardar suscripción</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => state({ isOpen: !u.isOpen }, u.isOpen ? "Pedidos cerrados." : "Pedidos abiertos.")}>
              {u.isOpen ? "Cerrar pedidos" : "Abrir pedidos"}
            </Button>
            {u.pausedUntil && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => state({ resumePause: true }, "Pausa reactivada.")}>Reactivar pausa</Button>
            )}
            {u.status === "published" ? (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirm(true)}>Despublicar tienda</Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => state({ status: "published" }, "Tienda publicada.")}>Publicar tienda</Button>
            )}
          </div>
          <div className="border-t border-ink/10 pt-4">
            <p className="text-sm font-medium text-ink">Límites especiales</p>
            <p className="mt-1 text-xs text-muted-foreground">Vacío = el del plan. Se guardan y se ven aquí; el servidor todavía no los aplica.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Productos" htmlFor={`lp-${u.id}`}>
                <Input id={`lp-${u.id}`} inputMode="numeric" value={lim.products} onChange={setL("products")} placeholder="Plan" />
              </Field>
              <Field label="Categorías" htmlFor={`lc-${u.id}`}>
                <Input id={`lc-${u.id}`} inputMode="numeric" value={lim.categories} onChange={setL("categories")} placeholder="Plan" />
              </Field>
              <Field label="Fotos por producto" htmlFor={`li-${u.id}`}>
                <Input id={`li-${u.id}`} inputMode="numeric" value={lim.imagesPerProduct} onChange={setL("imagesPerProduct")} placeholder="Plan" />
              </Field>
            </div>
            <Button className="mt-3" size="sm" variant="secondary" onClick={saveLimits} disabled={busy}>Guardar límites</Button>
          </div>
        </div>
      )}
      {dialog}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`¿Despublicar ${u.name}?`}
        description="Su catálogo dejará de ser público hasta que se vuelva a publicar."
        confirmLabel="Despublicar"
        onConfirm={async () => { await state({ status: "draft" }, "Tienda despublicada."); }}
      />
    </div>
  );
}
