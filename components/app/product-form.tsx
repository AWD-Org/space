"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { Field } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { deleteProduct, saveProduct } from "@/lib/actions/product";
import { createCategory } from "@/lib/actions/category";
import { centsToInput, parsePriceInput } from "@/lib/format";
import { categoryNameSchema, productFormSchema, type ProductFormValues } from "@/lib/validators";
import type { Category, ImageRef, Product } from "@/lib/types";
import { ImageUploader } from "./image-uploader";
import { SaveBar } from "./save-bar";

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
  const [categories, setCategories] = React.useState(initialCategories);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState<null | "save" | "another">(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [newCat, setNewCat] = React.useState<null | { value: string; error: string | null; busy: boolean }>(null);

  const initial: ProductFormValues = {
    name: product?.name ?? "",
    price: centsToInput(product?.price),
    priceFrom: product?.priceFrom ?? false,
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? null,
    availability: product?.availability ?? "available",
    visible: product?.visible ?? true,
  };
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), mode: "onTouched", defaultValues: initial });
  const imageKey = (list: ImageRef[]) => list.map((i) => i.path).join("|");
  const baselineImages = React.useRef(imageKey(product?.images ?? []));
  const changed = isDirty || imageKey(images) !== baselineImages.current;
  function discard() {
    reset(initial);
    setImages(product?.images ?? []);
    setNewCat(null);
  }
  const name = watch("name");
  const description = watch("description");
  const categoryId = watch("categoryId");

  async function persist(v: ProductFormValues, another: boolean) {
    setError(null);
    if (uploading) return toast.info("Espera a que terminen de subir las fotos.");
    setSaving(another ? "another" : "save");
    const res = await saveProduct({
      id: product?.id,
      name: v.name,
      description: v.description,
      price: parsePriceInput(v.price),
      priceFrom: v.priceFrom,
      availability: v.availability,
      visible: v.visible,
      categoryId: v.categoryId,
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

  const invalid = () => {
    setError(null);
    toast.warning("Revisa los campos marcados en rojo.");
  };
  const submitSave = handleSubmit((v) => persist(v, false), invalid);
  const submitAnother = handleSubmit((v) => persist(v, true), invalid);

  async function remove() {
    if (!product) return;
    const res = await deleteProduct(product.id);
    if (!res.ok) return toast.error(res.error);
    toast.success("Producto borrado.");
    router.push("/app/productos");
    router.refresh();
  }

  async function addCategory() {
    if (!newCat) return;
    const parsed = categoryNameSchema.safeParse(newCat.value);
    if (!parsed.success) return setNewCat({ ...newCat, error: parsed.error.issues[0]?.message ?? "Revisa el nombre." });
    setNewCat({ ...newCat, busy: true, error: null });
    const res = await createCategory(parsed.data);
    if (!res.ok) return setNewCat({ value: newCat.value, busy: false, error: res.error });
    setCategories((c) => [...c, res.data!]);
    setValue("categoryId", res.data!.id, { shouldDirty: true });
    setNewCat(null);
    toast.success(`Categoría “${res.data!.name}” creada.`);
  }

  return (
    <>
    <form onSubmit={submitSave} className="space-y-6" noValidate>
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <Link href="/app/productos" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Productos
          </Link>
          {product && (
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
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

        <Field label="Nombre" htmlFor="p-name" counter={`${name.length}/60`} error={errors.name?.message}>
          <Input id="p-name" {...register("name")} aria-invalid={!!errors.name} maxLength={60} placeholder="Ej. Brownie de nuez" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio" htmlFor="p-price" error={errors.price?.message} hint="En pesos mexicanos (MXN). Déjalo vacío si prefieres que te pregunten.">
            <Controller control={control} name="price" render={({ field }) => <MoneyInput id="p-price" value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={!!errors.price} />} />
          </Field>
          <label className="flex items-center justify-between gap-3 self-start rounded-xl bg-cloud px-4 py-3 sm:mt-7">
            <span>
              <span className="block text-sm font-medium text-ink">Es precio “desde”</span>
              <span className="block text-sm text-muted-foreground">Cuando cambia por tamaño o sabor.</span>
            </span>
            <Controller control={control} name="priceFrom" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Es precio desde" />} />
          </label>
        </div>

        {!compact && (
          <Field label="Descripción" htmlFor="p-desc" counter={`${description.length}/400`} error={errors.description?.message} hint="Qué incluye, tamaños, sabores o cuánto tardas en tenerlo.">
            <Textarea id="p-desc" {...register("description")} aria-invalid={!!errors.description} maxLength={400} />
          </Field>
        )}
      </section>

      {!compact && (
        <section className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Disponibilidad</p>
            <Controller
              control={control}
              name="availability"
              render={({ field }) => (
                <Segmented
                  label="Disponibilidad"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "available", label: "Disponible" },
                    { value: "onrequest", label: "Sobre pedido" },
                    { value: "soldout", label: "Se acabó" },
                  ]}
                />
              )}
            />
          </div>

          <Field label="Categoría" htmlFor={newCat ? "p-newcat" : "p-cat"} error={newCat?.error}>
            {newCat ? (
              <div className="flex gap-2">
                <Input
                  id="p-newcat"
                  autoFocus
                  value={newCat.value}
                  onChange={(e) => setNewCat({ ...newCat, value: e.target.value, error: null })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addCategory();
                    }
                    if (e.key === "Escape") setNewCat(null);
                  }}
                  maxLength={30}
                  placeholder="Ej. Postres, Pulseras, Bebidas"
                  aria-invalid={!!newCat.error}
                />
                <Button type="button" className="h-12 shrink-0 px-4" onClick={addCategory} disabled={newCat.busy} aria-label="Crear categoría">
                  {newCat.busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                  <span className="hidden sm:inline">Crear</span>
                </Button>
                <Button type="button" variant="secondary" className="h-12 w-12 shrink-0 px-0" onClick={() => setNewCat(null)} disabled={newCat.busy} aria-label="Cancelar">
                  <X aria-hidden />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select id="p-cat" value={categoryId ?? ""} onChange={(e) => setValue("categoryId", e.target.value || null, { shouldDirty: true })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {categories.length < categoryLimit && (
                  <Button type="button" variant="secondary" className="h-12 shrink-0" onClick={() => setNewCat({ value: "", error: null, busy: false })}>
                    <Plus aria-hidden /> Nueva
                  </Button>
                )}
              </div>
            )}
          </Field>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-cloud px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Mostrar en el catálogo</span>
              <span className="block text-sm text-muted-foreground">Apágalo para guardarlo sin que se vea.</span>
            </span>
            <Controller control={control} name="visible" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Mostrar en el catálogo" />} />
          </label>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {product && !compact && <SaveBar dirty={changed} saving={saving !== null} onDiscard={discard} />}

      <div className={compact ? "" : product ? "hidden" : "sticky bottom-20 z-20 -mx-4 flex gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pb-2 pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0 lg:bottom-0"}>
        {compact ? (
          <Button type="submit" size="lg" className="group h-14 w-full text-base" disabled={saving !== null || uploading}>
            {uploading || saving === "save" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> {uploading ? "Subiendo fotos…" : "Guardando…"}
              </>
            ) : (
              <>
                Guardar y seguir
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </>
            )}
          </Button>
        ) : (
          <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={saving !== null || uploading}>
            {uploading || saving === "save" ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {uploading ? "Subiendo fotos…" : saving === "save" ? "Guardando…" : product ? "Guardar cambios" : "Guardar producto"}
          </Button>
        )}
        {!product && !compact && (
          <Button type="button" variant="secondary" size="lg" disabled={saving !== null || uploading} onClick={submitAnother}>
            {saving === "another" && <Loader2 className="animate-spin" aria-hidden />}
            {saving === "another" ? "Guardando…" : "Guardar y otro"}
          </Button>
        )}
      </div>
    </form>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`¿Borrar “${product?.name ?? ""}”?`}
        description="No se puede deshacer."
        confirmLabel="Sí, borrar"
        onConfirm={async () => {
          await remove();
        }}
      />
    </>
  );
}
