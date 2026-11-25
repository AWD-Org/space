"use client";

import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { reconfirmAdminCode } from "@/lib/actions/admin-auth";
import { safe } from "@/lib/client/safe-action";
import type { ActionResult } from "@/lib/types";

const REAUTH = "REAUTH_REQUIRED";

/**
 * Ejecuta una acción delicada. Si el servidor pide reconfirmar (pasaron más de 5 minutos
 * desde el último código), abre un cuadro para el código y reintenta la misma acción.
 */
export function useReauth() {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const pending = React.useRef<{ run: () => Promise<ActionResult>; resolve: (r: ActionResult) => void } | null>(null);

  const guarded = React.useCallback(async (run: () => Promise<ActionResult>): Promise<ActionResult> => {
    const res = await safe(run);
    if (res.ok || res.error !== REAUTH) return res;
    return new Promise<ActionResult>((resolve) => {
      pending.current = { run, resolve };
      setCode("");
      setError("");
      setOpen(true);
    });
  }, []);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await safe(() => reconfirmAdminCode(code));
    if (!ok.ok) {
      setBusy(false);
      setError(ok.error);
      setCode("");
      return;
    }
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    const res = p ? await safe(p.run) : ok;
    setBusy(false);
    p?.resolve(res.ok || res.error !== REAUTH ? res : { ok: false, error: "No pudimos confirmar. Intenta de nuevo." });
  }

  function cancel(o: boolean) {
    if (busy || o) return;
    setOpen(false);
    pending.current?.resolve({ ok: false, error: "Acción cancelada." });
    pending.current = null;
  }

  const dialog = (
    <Sheet open={open} onOpenChange={cancel}>
      <SheetContent title="Confirma con tu código" description="Esta acción es delicada. Escribe el código actual de tu app de autenticación." side="bottom">
        <form onSubmit={confirm} className="space-y-4 px-5 pb-6 pt-5 sm:px-6" noValidate>
          <Field label="Código" htmlFor="reauth-code" error={error || undefined}>
            <Input
              id="reauth-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              autoFocus
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button type="submit" size="lg" className="w-full sm:w-auto" loading={busy} loadingText="Confirmando…" disabled={code.length !== 6}>Confirmar</Button>
            <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => cancel(false)} disabled={busy}>Cancelar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
  return { guarded, dialog };
}
