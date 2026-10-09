"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { safe } from "@/lib/client/safe-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { categoryFormSchema, categoryNameSchema, type CategoryFormValues } from "@/lib/validators";
import { createCategory, deleteCategory, renameCategory, reorderCategories } from "@/lib/actions/category";
import type { Category } from "@/lib/types";

export function CategoriesSheet({ open, onOpenChange, categories, limit }: { open: boolean; onOpenChange: (o: boolean) => void; categories: Category[]; limit: number }) {
  const router = useRouter();
  const [list, setList] = React.useState(categories);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);
  const [renameError, setRenameError] = React.useState<{ id: string; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema), mode: "onSubmit", defaultValues: { name: "" } });
  React.useEffect(() => setList(categories), [categories]);

  const add = handleSubmit(async (v) => {
    const res = await safe(() => createCategory(v.name));
    if (!res.ok) return setFieldError("name", { message: res.error }, { shouldFocus: true });
    reset({ name: "" });
    setList((l) => [...l, res.data!]);
    toast.success(`Categoría “${res.data!.name}” creada.`);
    router.refresh();
  });

  async function rename(id: string, value: string) {
    const current = list.find((c) => c.id === id);
    if (!current || current.name === value.trim()) return setRenameError(null);
    const parsed = categoryNameSchema.safeParse(value);
    if (!parsed.success) return setRenameError({ id, message: parsed.error.issues[0]?.message ?? "Revisa el nombre." });
    setRenameError(null);
    const res = await safe(() => renameCategory(id, value));
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  async function remove(c: Category) {
    setList((l) => l.filter((x) => x.id !== c.id));
    const res = await safe(() => deleteCategory(c.id));
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    const res = await safe(() => reorderCategories(next.map((c) => c.id)));
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Categorías" description={`Agrupan tu catálogo en pestañas. Hasta ${limit}.`} side="bottom">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-6">
          {list.length > 0 && (
            <ul className="space-y-2">
              {list.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Input defaultValue={c.name} onBlur={(e) => rename(c.id, e.target.value)} aria-label={`Nombre de la categoría ${c.name}`} autoCapitalize="words" enterKeyHint="done" aria-invalid={renameError?.id === c.id} className="h-11" />
                    {renameError?.id === c.id && (
                      <p role="alert" className="mt-1 text-sm text-destructive">
                        {renameError.message}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ${c.name}`}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Bajar ${c.name}`}>
                    <ArrowDown />
                  </Button>
                  <Button type="button" variant="danger" size="icon" onClick={() => setToDelete(c)} aria-label={`Borrar ${c.name}`}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {list.length < limit ? (
            <form onSubmit={add} className="mt-4 flex items-start gap-2" noValidate>
              <Field label="Nueva categoría" className="min-w-0 flex-1" error={errors.name?.message}>
                <Input {...register("name")} placeholder="Ej. Postres, Pulseras, Bebidas" autoCapitalize="words" enterKeyHint="done" aria-invalid={!!errors.name} maxLength={30} className="h-11" />
              </Field>
              <Button type="submit" className="mt-[1.625rem]" loading={isSubmitting} loadingText="Agregando…">
                Agregar
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Llegaste a {limit} categorías, el máximo del plan gratis.</p>
          )}
        </div>
      </SheetContent>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Borrar “${toDelete?.name ?? ""}”?`}
        description="Sus productos quedan sin categoría."
        confirmLabel="Sí, borrar"
        onConfirm={async () => {
          if (toDelete) await remove(toDelete);
        }}
      />
    </Sheet>
  );
}
