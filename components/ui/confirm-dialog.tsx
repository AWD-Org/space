"use client";

import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/** Confirmación propia (en móvil sale desde abajo). Reemplaza al confirm() del navegador. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Borrar",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);
  async function go() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  }
  return (
    <Sheet open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <SheetContent title={title} description={description} side="bottom">
        <div className="flex flex-col gap-2 px-5 pb-safe pb-6 pt-5 sm:flex-row-reverse sm:px-6">
          <Button type="button" variant="danger" size="lg" className="w-full sm:w-auto" onClick={go} loading={busy} loadingText="Borrando…">
            {confirmLabel}
          </Button>
          <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
