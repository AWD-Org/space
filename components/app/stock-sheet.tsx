"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { safe } from "@/lib/client/safe-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { registerSale, setStock } from "@/lib/actions/stock";
import { availableFor, isTracked, stockMode } from "@/lib/stock";
import type { Product } from "@/lib/types";

/** «Vendí N» (registra la venta y descuenta) y «Ajustar stock» (reponer o corregir) de un producto. */
export function StockSheet({ product, open, onOpenChange }: { product: Product | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"sold" | "adjust">("sold");
  const [qty, setQty] = React.useState("1");
  const [value, setValue] = React.useState("");
  const [stockText, setStockText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const options = product?.options ?? [];
  const perValue = !!product && stockMode(product) === "values";
  const opt = perValue ? options[0]! : null;

  React.useEffect(() => {
    if (!open || !product) return;
    setMode("sold");
    setQty("1");
    setError(null);
    const first = opt?.values.find((v) => !v.soldOut && v.stock !== 0) ?? opt?.values[0];
    setValue(first?.label ?? "");
    setStockText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  // Al cambiar de valor o de modo, el campo de stock arranca con el stock actual (vacío si no lleva la cuenta).
  React.useEffect(() => {
    if (!product || mode !== "adjust") return;
    const n = availableFor(product, opt ? { [opt.name]: value } : undefined);
    setStockText(n === null ? "" : String(n));
  }, [mode, value, product, opt]);

  if (!product) return null;
  const current = availableFor(product, opt ? { [opt.name]: value } : undefined);
  const tracked = isTracked(product);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "sold") {
        const n = Number(qty);
        if (!/^\d{1,4}$/.test(qty.trim()) || n < 1) return setError("Escribe cuántas vendiste, un número entero de 1 en adelante.");
        const res = await safe(() => registerSale({ productId: product.id, qty: n, value: perValue ? value : undefined }));
        if (!res.ok) return setError(res.error);
        const left = res.data!.left;
        toast.success(left === null ? `Venta registrada: ${n} × ${product.name}.` : left === 0 ? `Venta registrada. Ya no te quedan, se muestra agotado.` : `Venta registrada. Te quedan ${left}.`);
      } else {
        const text = stockText.trim();
        if (text && !/^\d{1,5}$/.test(text)) return setError("El stock es un número entero, por ejemplo 12.");
        const res = await safe(() => setStock({ productId: product.id, stock: text ? Number(text) : null, value: perValue ? value : undefined }));
        if (!res.ok) return setError(res.error);
        toast.success(text ? "Stock actualizado." : "Ya no se lleva la cuenta de este producto.");
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={product.name} description="Registra una venta o corrige cuántas unidades tienes." side="bottom">
        <form onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6 pt-4 sm:px-6" noValidate>
          <Segmented
            label="Qué quieres hacer"
            value={mode}
            onChange={(v) => {
              setMode(v as "sold" | "adjust");
              setError(null);
            }}
            options={[
              { value: "sold", label: "Vendí" },
              { value: "adjust", label: "Ajustar stock" },
            ]}
          />

          {opt && (
            <Field label={opt.name} htmlFor="stock-value">
              <Select id="stock-value" value={value} onChange={(e) => setValue(e.target.value)}>
                {opt.values.map((v) => (
                  <option key={v.label} value={v.label}>
                    {v.label}
                    {v.stock !== undefined ? ` · ${v.stock} en stock` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {mode === "sold" ? (
            <Field
              label="Unidades vendidas"
              htmlFor="stock-qty"
              hint={current !== null ? `Tienes ${current} en stock; se descontarán.` : tracked && perValue ? "Este valor no lleva la cuenta: se registra la venta sin descontar." : "Este producto no lleva la cuenta: se registra la venta sin descontar."}
            >
              <Input id="stock-qty" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="off" maxLength={4} />
            </Field>
          ) : (
            <Field label="Unidades en stock" htmlFor="stock-set" hint="Déjalo vacío para dejar de llevar la cuenta.">
              <Input id="stock-set" value={stockText} onChange={(e) => setStockText(e.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="off" maxLength={5} placeholder="Sin cuenta" />
            </Field>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={busy} loadingText="Guardando…">
            {mode === "sold" ? "Registrar venta" : "Guardar stock"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
