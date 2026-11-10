"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { safe } from "@/lib/client/safe-action";
import { setStoreState, setSubscription } from "@/lib/actions/admin";
import { STATUS_LABEL } from "@/lib/admin-labels";
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
};

/** Edición de la suscripción y del estado de una tienda, desde la tabla de usuarios. */
export function UserAdmin({ u }: { u: AdminUser }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [f, setF] = React.useState({ planName: u.planName, status: u.subStatus, renewsOn: u.renewsOn, amount: u.amount, note: u.note });
  const [confirm, setConfirm] = React.useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    const res = await safe(() => setSubscription(u.id, f));
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Suscripción guardada.");
    router.refresh();
  }

  async function state(patch: { status?: "draft" | "published"; isOpen?: boolean }, msg: string): Promise<void> {
    setBusy(true);
    const res = await safe(() => setStoreState(u.id, patch));
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
              <Input id={`plan-${u.id}`} value={f.planName} onChange={set("planName")} maxLength={40} />
            </Field>
            <Field label="Estado" htmlFor={`st-${u.id}`}>
              <Select id={`st-${u.id}`} value={f.status} onChange={set("status")}>
                {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((k) => (
                  <option key={k} value={k}>{STATUS_LABEL[k]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Próxima renovación" htmlFor={`ren-${u.id}`}>
              <Input id={`ren-${u.id}`} type="date" value={f.renewsOn} onChange={set("renewsOn")} />
            </Field>
            <Field label="Monto por periodo (MXN)" htmlFor={`amt-${u.id}`}>
              <Input id={`amt-${u.id}`} inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="0" />
            </Field>
          </div>
          <Field label="Nota interna" htmlFor={`note-${u.id}`}>
            <Input id={`note-${u.id}`} value={f.note} onChange={set("note")} maxLength={300} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>Guardar suscripción</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => state({ isOpen: !u.isOpen }, u.isOpen ? "Pedidos cerrados." : "Pedidos abiertos.")}>
              {u.isOpen ? "Cerrar pedidos" : "Abrir pedidos"}
            </Button>
            {u.status === "published" ? (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirm(true)}>Despublicar tienda</Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => state({ status: "published" }, "Tienda publicada.")}>Publicar tienda</Button>
            )}
          </div>
        </div>
      )}
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
