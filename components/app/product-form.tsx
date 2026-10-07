"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { deleteProduct, saveProduct } from "@/lib/actions/product";
import { createCategory } from "@/lib/actions/category";
import { centsToInput, parsePriceInput } from "@/lib/format";
import type { Availability, Category, ImageRef, Product } from "@/lib/types";
import { ImageUploader } from "./image-uploader";

export function ProductForm({
  product,
  categories: initialCategories,
  maxImages,
  categoryLimit,
  compact,
  onSaved,
}: {
  product?: Product;
  categories: Category[];
  maxImages: number;
  categoryLimit: number;
  /** Versión corta para el onboarding. */
  compact?: boolean;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const [images, setImages] = React.useState<ImageRef[]>(product?.images ?? []);
  const [name, setName] = React.useState(product?.name ?? "");
  const [price, setPrice] = React.useState(centsToInput(product?.price));
  const [priceFrom, setPriceFrom] = React.useState(product?.priceFrom ?? false);
  const [description, setDescription] = React.useState(product?.description ?? "");
  const [categoryId, setCategoryId] = React.useState<string | null>(product?.categoryId ?? null);
  const [availability, setAvailability] = React.useState<Availability>(product?.availability ?? "available");
  const [visible, setVisible] = React.useState(product?.visible ?? true);
  const [categories, setCategories] = React.useState(initialCategories);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState<null | "save" | "another">(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(another: boolean) {
    setError(null);
    const cents = parsePriceInput(price);
    if (price.trim() && cents == null) return setError("Revisa el precio: solo números, por ejemplo 45 o 45.50.");
    setSaving(another ? "another" : "save");
    const res = await saveProduct({
      id: product?.id,
      name,
      description,
      price: cents,
      priceFrom,
      availability,
      visible,
      categoryId,
      images,
    });
    setSaving(null);
    if (!res.ok) return setError(res.error);
    toast.success(product ? "Cambios guardados." : "Producto agregado a tu catálogo.");
    if (onSaved) return onSaved(res.data!.id);
    if (another) {
      router.replace("/app/productos/nuevo?otro=" + Date.now());
      router.refresh();
    } else {
      router.push("/app/productos");
      router.refresh();
    }
  }

  async function remove() {
    if (!product || !confirm(`¿Borrar “${product.name}”? No se puede deshacer.`)) return;
    const res = await deleteProduct(product.id);
    if (!res.ok) return toast.error(res.error);
    toast.success("Producto borrado.");
    router.push("/app/productos");
    router.refresh();
  }

  async function addCategory() {
    const value = prompt("Nombre de la categoría");
    if (!value) return;
    const res = await createCategory(value);
    if (!res.ok) return toast.error(res.error);
    setCategories((c) => [...c, res.data!]);
    setCategoryId(res.data!.id);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      className="space-y-6"
      noValidate
    >
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <Link href="/app/productos" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Productos
          </Link>
          {product && (
            <Button type="button" variant="danger" size="sm" onClick={remove}>
              <Trash2 />
              Borrar
            </Button>
          )}
        </div>
      )}
      {!compact && <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-3xl">{product ? "Editar producto" : "Nuevo producto"}</h1>}

      <section className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Fotos</p>
          <ImageUploader value={images} onChange={setImages} max={compact ? 1 : maxImages} onBusyChange={setUploading} />
        </div>

        <Field label="Nombre" htmlFor="p-name" counter={`${name.length}/60`}>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ej. Brownie de nuez" required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio" htmlFor="p-price" hint="Déjalo vacío si prefieres que te pregunten.">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input id="p-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="45" className="pl-8 tabular-nums" />
            </div>
          </Field>
          <label className="flex items-center justify-between gap-3 self-start rounded-xl bg-cloud px-4 py-3 sm:mt-7">
            <span>
              <span className="block text-sm font-medium text-ink">Es precio “desde”</span>
              <span className="block text-sm text-muted-foreground">Cuando cambia por tamaño o sabor.</span>
            </span>
            <Switch checked={priceFrom} onCheckedChange={setPriceFrom} aria-label="Es precio desde" />
          </label>
        </div>

        {!compact && (
          <Field label="Descripción" htmlFor="p-desc" counter={`${description.length}/400`} hint="Qué incluye, tamaños, sabores o cuánto tardas en tenerlo.">
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
          </Field>
        )}
      </section>

      {!compact && (
        <section className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Disponibilidad</p>
            <Segmented
              label="Disponibilidad"
              value={availability}
              onChange={setAvailability}
              options={[
                { value: "available", label: "Disponible" },
                { value: "onrequest", label: "Sobre pedido" },
                { value: "soldout", label: "Se acabó" },
              ]}
            />
          </div>

          <Field label="Categoría" htmlFor="p-cat">
            <div className="flex gap-2">
              <select
                id="p-cat"
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length < categoryLimit && (
                <Button type="button" variant="secondary" className="h-12 shrink-0" onClick={addCategory}>
                  Nueva
                </Button>
              )}
            </div>
          </Field>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-cloud px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Mostrar en el catálogo</span>
              <span className="block text-sm text-muted-foreground">Apágalo para guardarlo sin que se vea.</span>
            </span>
            <Switch checked={visible} onCheckedChange={setVisible} aria-label="Mostrar en el catálogo" />
          </label>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className={compact ? "" : "sticky bottom-20 z-20 -mx-4 flex gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pb-2 pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0 lg:bottom-0"}>
        <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={saving !== null || uploading}>
          {uploading ? "Subiendo fotos…" : saving === "save" ? "Guardando…" : product ? "Guardar cambios" : compact ? "Guardar y seguir" : "Guardar producto"}
        </Button>
        {!product && !compact && (
          <Button type="button" variant="secondary" size="lg" disabled={saving !== null || uploading} onClick={() => submit(true)}>
            {saving === "another" ? "Guardando…" : "Guardar y otro"}
          </Button>
        )}
      </div>
    </form>
  );
}
