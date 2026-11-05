"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { safe } from "@/lib/client/safe-action";
import { undoSale } from "@/lib/actions/stock";

/** Deshace una venta registrada por error: la quita del historial y devuelve las piezas al stock si se habían descontado. */
export function UndoSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await safe(() => undoSale(saleId));
        setBusy(false);
        if (!res.ok) return toast.error(res.error);
        toast.success("Venta deshecha.");
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-spaceBlue hover:underline disabled:opacity-50"
    >
      Deshacer
    </button>
  );
}
