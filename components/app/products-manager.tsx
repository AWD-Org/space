"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, Eye, EyeOff, FileSpreadsheet, GripVertical, MoreVertical, PackageCheck, PackageX, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  selecting,
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
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onAvailability: (a: Availability) => void;
  onVisible: (v: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id, disabled: selecting });
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
      className={cn("flex items-center gap-2 bg-white py-3 pr-1 sm:gap-3 sm:pr-2", isDragging && "relative z-10 rounded-xl shadow-lg", selected && "bg-primary/[0.04]")}
    >
      {selecting ? (
        <button type="button" role="checkbox" aria-checked={selected} aria-label={`Elegir ${product.name}`} onClick={onToggle} className="grid h-11 w-11 shrink-0 place-items-center">
          <span className={cn("grid h-6 w-6 place-items-center rounded-md ring-1 ring-inset transition-colors", selected ? "bg-primary text-white ring-primary" : "bg-white ring-border")}>
            {selected && <Check className="h-4 w-4" aria-hidden />}
          </span>
        </button>
      ) : (
        <button type="button" className="touch-none cursor-grab px-1 text-slate active:cursor-grabbing" aria-label={`Mover ${product.name}`} {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      {selecting ? (
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {body}
        </button>
      ) : (
        <Link href={`/app/productos/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          {body}
        </Link>
      )}
      {!selecting && (
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
  const [selecting, setSelecting] = React.useState(false);
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
  function stopSelecting() {
    setSelecting(false);
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
    stopSelecting();
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
          {products.length > 1 && (
            <Button variant="secondary" onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
              {selecting ? <X /> : <Check />}
              {selecting ? "Cancelar" : "Seleccionar"}
            </Button>
          )}
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

      {products.length > 1 && !selecting && (
        <p className="mb-3 flex items-center gap-1.5 text-[0.8rem] text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
          Arrastra los productos para cambiar el orden en que se ven en tu catálogo.
        </p>
      )}
      {selecting && (
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <p className="tabular-nums text-muted-foreground" aria-live="polite">
            {picked.size === 0 ? "Toca los productos que quieras cambiar." : `${picked.size} ${picked.size === 1 ? "elegido" : "elegidos"}`}
          </p>
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setPicked(picked.size === products.length ? new Set() : new Set(products.map((p) => p.id)))}
          >
            {picked.size === products.length ? "Quitar todos" : "Elegir todos"}
          </button>
        </div>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-ink/5">
                {products.map((p) => (
                  <Row
                    key={p.id}
                    product={p}
                    category={p.categoryId ? catName.get(p.categoryId) : undefined}
                    selecting={selecting}
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


      {selecting && picked.size > 0 && (
        <div className="fixed inset-x-0 bottom-[6rem] z-40 px-3 lg:bottom-5 lg:left-auto lg:right-6 lg:px-0" role="toolbar" aria-label="Acciones para los productos elegidos">
          <div className="mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-2xl bg-ink p-2.5 text-white shadow-xl lg:max-w-2xl">
            <BarButton disabled={bulkBusy} onClick={() => bulk({ type: "availability", value: "soldout" }, "{n} marcados como agotados.")}>
              <PackageX className="h-4 w-4" aria-hidden /> Agotado
            </BarButton>
            <BarButton disabled={bulkBusy} onClick={() => bulk({ type: "availability", value: "available" }, "{n} disponibles otra vez.")}>
              <PackageCheck className="h-4 w-4" aria-hidden /> Disponible
            </BarButton>
            <BarButton disabled={bulkBusy} onClick={() => bulk({ type: "visible", value: false }, "{n} ocultos.")}>
              <EyeOff className="h-4 w-4" aria-hidden /> Ocultar
            </BarButton>
            <BarButton disabled={bulkBusy} onClick={() => bulk({ type: "visible", value: true }, "{n} visibles.")}>
              <Eye className="h-4 w-4" aria-hidden /> Mostrar
            </BarButton>
            {categories.length > 0 && (
              <Select
                variant="pill"
                wrapperClassName="shrink-0"
                aria-label="Cambiar categoría"
                value=""
                disabled={bulkBusy}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) void bulk({ type: "category", categoryId: v === "__none" ? null : v }, "Categoría cambiada en {n}.");
                }}
                className="h-9 bg-white/10 text-white ring-white/20"
              >
                <option value="">Mover a categoría…</option>
                <option value="__none">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="text-ink">
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
            <BarButton disabled={bulkBusy} onClick={() => setConfirmDelete(true)} danger>
              <Trash2 className="h-4 w-4" aria-hidden /> Eliminar
            </BarButton>
          </div>
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

function BarButton({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors disabled:opacity-50",
        danger ? "bg-[#B42318] text-white hover:bg-[#9A1D14]" : "bg-white/10 text-white hover:bg-white/20"
      )}
    >
      {children}
    </button>
  );
}
