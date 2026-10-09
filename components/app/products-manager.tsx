"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, Plus, Tags } from "lucide-react";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderProducts, setAvailability } from "@/lib/actions/product";
import { AVAILABILITY_LABEL, formatPrice } from "@/lib/format";
import type { Availability, Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoriesSheet } from "./categories-sheet";

function Row({ product, category, onAvailability }: { product: Product; category?: string; onAvailability: (a: Availability) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 bg-white py-3 pr-3", isDragging && "relative z-10 rounded-xl shadow-lg")}
    >
      <button type="button" className="touch-none cursor-grab px-1 text-slate active:cursor-grabbing" aria-label={`Mover ${product.name}`} {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <Link href={`/app/productos/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-spaceMist">
          {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 font-medium leading-snug text-ink">{product.name}</p>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <span className="tabular-nums">{formatPrice(product.price, product.priceFrom)}</span>
            {category && <span>· {category}</span>}
            {!product.visible && (
              <span className="inline-flex items-center gap-1">
                · <EyeOff className="h-3.5 w-3.5" aria-hidden /> Oculto
              </span>
            )}
          </p>
        </div>
      </Link>
      <Select
        variant="pill"
        wrapperClassName="shrink-0"
        value={product.availability}
        onChange={(e) => onAvailability(e.target.value as Availability)}
        aria-label={`Disponibilidad de ${product.name}`}
        className={cn("w-[8.5rem] sm:w-auto", product.availability === "soldout" && "text-[#9A3412]")}
      >
        {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((a) => (
          <option key={a} value={a}>
            {AVAILABILITY_LABEL[a]}
          </option>
        ))}
      </Select>
    </li>
  );
}

export function ProductsManager({ products: initial, categories, limit, categoryLimit }: { products: Product[]; categories: Category[]; limit: number; categoryLimit: number }) {
  const router = useRouter();
  const [products, setProducts] = React.useState(initial);
  const [catsOpen, setCatsOpen] = React.useState(false);
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
    const res = await reorderProducts(next.map((p) => p.id));
    if (!res.ok) toast.error(res.error);
  }

  async function changeAvailability(id: string, a: Availability) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, availability: a } : p)));
    const res = await setAvailability(id, a);
    if (!res.ok) {
      toast.error(res.error);
      router.refresh();
    }
  }

  const atLimit = products.length >= limit;
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-3xl">Productos</h1>
          <p className="mt-1 tabular-nums text-muted-foreground">
            {products.length} de {limit} en tu plan gratis
          </p>
        </div>
        <div className="flex gap-2">
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-ink/5">
                {products.map((p) => (
                  <Row key={p.id} product={p} category={p.categoryId ? catName.get(p.categoryId) : undefined} onAvailability={(a) => changeAvailability(p.id, a)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {!atLimit && (
        <Link
          href="/app/productos/nuevo"
          className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 sm:hidden"
          aria-label="Agregar producto"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}

      <CategoriesSheet open={catsOpen} onOpenChange={setCatsOpen} categories={categories} limit={categoryLimit} />
    </>
  );
}
