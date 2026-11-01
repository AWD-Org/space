"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Copy, Eye, EyeOff, FileSpreadsheet, FolderInput, GripVertical, Minus, MoreVertical, PackageCheck, PackageX, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { safe } from "@/lib/client/safe-action";
import { Button } from "@/components/ui/button";
import { bulkProducts, duplicateProduct, reorderProducts, setAvailability, type BulkOp } from "@/lib/actions/product";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/format";
import type { Availability, Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoriesSheet } from "./categories-sheet";
import { ImportSheet } from "./import-sheet";

function Row({
  product,
  category,
  selected,
  onToggle,
  onAvailability,
  onVisible,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  product: Product;
  category?: string;
  selected: boolean;
  onToggle: () => void;
  onAvailability: (a: Availability) => void;
  onVisible: (v: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const soldOut = product.availability === "soldout";
  const body = (
    <>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl skeleton-img">
        {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="56px" className={cn("object-cover", soldOut && "opacity-60")} />}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 font-medium leading-snug text-ink">{product.name}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span className="tabular-nums">{formatPrice(product.price, product.priceFrom)}</span>
          {category && <span>· {category}</span>}
          {soldOut && <span className="font-medium text-[#9A3412]">· Agotado</span>}
          {!product.visible && (
            <span className="inline-flex items-center gap-1">
              · <EyeOff className="h-3.5 w-3.5" aria-hidden /> Oculto
            </span>
          )}
        </p>
      </div>
    </>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 bg-white py-3 pr-1 transition-colors sm:gap-2 sm:pr-2", isDragging && "relative z-10 rounded-xl shadow-lg", selected && "bg-primary/[0.04]")}
    >
      <CheckBox checked={selected} onChange={onToggle} label={`Elegir ${product.name}`} />
      <button type="button" className="touch-none cursor-grab px-0.5 text-slate active:cursor-grabbing" aria-label={`Mover ${product.name}`} {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <Link href={`/app/productos/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {body}
      </Link>
      {(
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Acciones de ${product.name}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate outline-none transition-colors hover:bg-cloud hover:text-ink focus-visible:ring-2 focus-visible:ring-primary data-[state=open]:bg-cloud"
          >
            <MoreVertical className="h-5 w-5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => router.push(`/app/productos/${product.id}`)}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAvailability(soldOut ? "available" : "soldout")}>
              {soldOut ? <PackageCheck /> : <PackageX />}
              {soldOut ? "Volver a disponible" : "Marcar como agotado"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onVisible(!product.visible)}>
              {product.visible ? <EyeOff /> : <Eye />}
              {product.visible ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={duplicating} onSelect={onDuplicate}>
              <Copy /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onSelect={onDelete}>
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

export function ProductsManager({ products: initial, categories, limit, categoryLimit }: { products: Product[]; categories: Category[]; limit: number; categoryLimit: number }) {
  const router = useRouter();
  const [products, setProducts] = React.useState(initial);
  const [catsOpen, setCatsOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Product | null>(null);
  const [dupBusy, setDupBusy] = React.useState<string | null>(null);
  React.useEffect(() => setProducts(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = products.findIndex((p) => p.id === e.active.id);
    const to = products.findIndex((p) => p.id === e.over!.id);
    const next = arrayMove(products, from, to);
    setProducts(next);
    const res = await safe(() => reorderProducts(next.map((p) => p.id)));
    if (!res.ok) toast.error(res.error);
  }

  async function changeAvailability(id: string, a: Availability) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, availability: a } : p)));
    const res = await safe(() => setAvailability(id, a));
    if (!res.ok) {
      toast.error(res.error);
      router.refresh();
    }
  }

  async function changeVisible(id: string, visible: boolean) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, visible } : p)));
    const res = await safe(() => bulkProducts([id], { type: "visible", value: visible }));
    if (!res.ok) {
      toast.error(res.error);
      router.refresh();
      return;
    }
    toast.success(visible ? "Ya se ve en tu catálogo." : "Quedó oculto de tu catálogo.");
  }

  async function removeOne() {
    if (!toDelete) return;
    const id = toDelete.id;
    const res = await safe(() => bulkProducts([id], { type: "delete" }));
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setProducts((ps) => ps.filter((p) => p.id !== id));
    toast.success("Producto eliminado.");
    router.refresh();
  }

  async function duplicate(id: string) {
    setDupBusy(id);
    const res = await safe(() => duplicateProduct(id));
    setDupBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("Listo: creamos una copia oculta. Edítala y muéstrala cuando esté lista.");
    router.push(`/app/productos/${res.data!.id}`);
  }

  function toggle(id: string) {
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearPicked() {
    setPicked(new Set());
  }

  async function bulk(op: BulkOp, done: string) {
    if (picked.size === 0) return;
    setBulkBusy(true);
    const ids = [...picked];
    const res = await safe(() => bulkProducts(ids, op));
    setBulkBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(done.replace("{n}", String(res.data!.count)));
    if (op.type === "delete") setProducts((ps) => ps.filter((p) => !picked.has(p.id)));
    clearPicked();
    router.refresh();
  }

  const atLimit = products.length >= limit;
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-3xl">Productos</h1>
          <p className="mt-1 tabular-nums text-muted-foreground">
            {products.length} de {limit} en tu plan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet />
            Importar
          </Button>
          <Button variant="secondary" onClick={() => setCatsOpen(true)}>
            <Tags />
            Categorías
          </Button>
          {atLimit ? (
            <Button disabled className="hidden sm:inline-flex">
              Llegaste al máximo
            </Button>
          ) : (
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/app/productos/nuevo">
                <Plus />
                Agregar producto
              </Link>
            </Button>
          )}
        </div>
      </div>

      {atLimit && (
        <p className="mb-4 rounded-xl bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C2D12]">
          Tienes {limit} productos, el máximo del plan gratis. Borra o reemplaza uno para subir otro.
        </p>
      )}

      {products.length > 1 && (
        <p className="mb-3 flex items-center gap-1.5 text-[0.8rem] text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
          Arrastra los productos para cambiar el orden en que se ven en tu catálogo.
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-ink/5">
          <p className="font-display text-xl font-semibold text-ink">Aquí van tus productos</p>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">Con una foto, un nombre y un precio basta. Lo demás lo puedes agregar después.</p>
          <Button asChild className="mt-6">
            <Link href="/app/productos/nuevo">
              <Plus />
              Subir el primero
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white px-2 ring-1 ring-ink/5 sm:px-3">
          <div className="flex h-14 items-center gap-2 border-b border-ink/5 pr-1 sm:gap-3 sm:pr-2">
            <CheckBox
              checked={picked.size === products.length ? true : picked.size > 0 ? "mixed" : false}
              onChange={() => setPicked(picked.size === products.length ? new Set() : new Set(products.map((p) => p.id)))}
              label="Seleccionar todos los productos"
            />
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground" aria-live="polite">
              {picked.size === 0 ? "Seleccionar todo" : <span className="font-medium text-ink">{picked.size} {picked.size === 1 ? "seleccionado" : "seleccionados"}</span>}
            </p>
            {picked.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" disabled={bulkBusy} className="motion-rise">
                    Acciones
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => bulk({ type: "availability", value: "soldout" }, "{n} marcados como agotados.")}>
                    <PackageX /> Marcar como agotado
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => bulk({ type: "availability", value: "available" }, "{n} disponibles otra vez.")}>
                    <PackageCheck /> Volver a disponible
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => bulk({ type: "visible", value: false }, "{n} ocultos.")}>
                    <EyeOff /> Ocultar del catálogo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => bulk({ type: "visible", value: true }, "{n} visibles.")}>
                    <Eye /> Mostrar en el catálogo
                  </DropdownMenuItem>
                  {categories.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderInput /> Mover a categoría
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => bulk({ type: "category", categoryId: null }, "Categoría cambiada en {n}.")}>Sin categoría</DropdownMenuItem>
                        {categories.map((c) => (
                          <DropdownMenuItem key={c.id} onSelect={() => bulk({ type: "category", categoryId: c.id }, "Categoría cambiada en {n}.")}>
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem danger onSelect={() => setConfirmDelete(true)}>
                    <Trash2 /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-ink/5">
                {products.map((p) => (
                  <Row
                    key={p.id}
                    product={p}
                    category={p.categoryId ? catName.get(p.categoryId) : undefined}
                    selected={picked.has(p.id)}
                    onToggle={() => toggle(p.id)}
                    onAvailability={(a) => changeAvailability(p.id, a)}
                    onVisible={(v) => changeVisible(p.id, v)}
                    onDuplicate={() => duplicate(p.id)}
                    onDelete={() => setToDelete(p)}
                    duplicating={dupBusy === p.id}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}


      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`¿Eliminar ${picked.size} ${picked.size === 1 ? "producto" : "productos"}?`}
        description="Se borran con sus fotos y no se pueden recuperar."
        confirmLabel="Eliminar"
        onConfirm={async () => { await bulk({ type: "delete" }, "{n} eliminados."); }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={toDelete ? `¿Eliminar “${toDelete.name}”?` : ""}
        description="Se borra con sus fotos y no se puede recuperar."
        confirmLabel="Eliminar"
        onConfirm={removeOne}
      />
      <ImportSheet open={importOpen} onOpenChange={setImportOpen} hasProducts={products.length > 0} />
      <CategoriesSheet open={catsOpen} onOpenChange={setCatsOpen} categories={categories} limit={categoryLimit} />
    </>
  );
}

function CheckBox({ checked, onChange, label }: { checked: boolean | "mixed"; onChange: () => void; label: string }) {
  const on = checked === true || checked === "mixed";
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className="group grid h-11 w-10 shrink-0 place-items-center rounded-full outline-none sm:w-11">
      <span
        className={cn(
          "grid h-[1.4rem] w-[1.4rem] place-items-center rounded-md ring-1 ring-inset transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-primary",
          on ? "bg-primary text-white ring-primary" : "bg-white ring-border group-hover:ring-slate"
        )}
      >
        {checked === "mixed" ? <Minus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : null}
      </span>
    </button>
  );
}
