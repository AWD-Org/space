"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory, renameCategory, reorderCategories } from "@/lib/actions/category";
import type { Category } from "@/lib/types";

export function CategoriesSheet({ open, onOpenChange, categories, limit }: { open: boolean; onOpenChange: (o: boolean) => void; categories: Category[]; limit: number }) {
  const router = useRouter();
  const [list, setList] = React.useState(categories);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => setList(categories), [categories]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createCategory(name);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    setName("");
    setList((l) => [...l, res.data!]);
    router.refresh();
  }

  async function rename(id: string, value: string) {
    const current = list.find((c) => c.id === id);
    if (!current || current.name === value.trim()) return;
    const res = await renameCategory(id, value);
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  async function remove(c: Category) {
    if (!confirm(`¿Borrar la categoría “${c.name}”? Sus productos quedan sin categoría.`)) return;
    setList((l) => l.filter((x) => x.id !== c.id));
    const res = await deleteCategory(c.id);
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    const res = await reorderCategories(next.map((c) => c.id));
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
                  <Input defaultValue={c.name} onBlur={(e) => rename(c.id, e.target.value)} aria-label={`Nombre de la categoría ${c.name}`} className="h-11" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ${c.name}`}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Bajar ${c.name}`}>
                    <ArrowDown />
                  </Button>
                  <Button type="button" variant="danger" size="icon" onClick={() => remove(c)} aria-label={`Borrar ${c.name}`}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {list.length < limit ? (
            <form onSubmit={add} className="mt-4 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Postres, Pulseras, Bebidas" aria-label="Nueva categoría" className="h-11" />
              <Button type="submit" disabled={busy || name.trim().length < 2}>
                Agregar
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Llegaste a {limit} categorías, el máximo del plan gratis.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
