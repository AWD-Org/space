"use server";

import { getDb, increment } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { categoriesPath, getLimits, getStore, productsPath, storePath } from "@/lib/data/queries";
import { copyImage, removeImages, ownsPath } from "@/lib/storage/server";
import { slugify } from "@/lib/slug";
import { firstError, productSchema, type ProductInput } from "@/lib/validators";
import type { ActionResult, Availability, ImageRef, Product, Store } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

async function uniqueProductSlug(uid: string, name: string, exceptId?: string) {
  const db = await getDb();
  const base = slugify(name) || "producto";
  const existing = await db.list<Product>(productsPath(uid));
  const used = new Set(existing.filter((p) => p.id !== exceptId).map((p) => p.slug));
  if (!used.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now().toString(36)}`;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const data = parsed.data;
    const limits = await getLimits();
    if (data.images.length > limits.imagesPerProduct) {
      throw new UserError(`Cada producto puede tener hasta ${limits.imagesPerProduct} fotos.`);
    }
    if (data.images.some((img) => !ownsPath(user.uid, img.path))) throw new UserError("Hay una foto que no es tuya.");

    const db = await getDb();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    if (data.categoryId) {
      const cat = await db.get(`${categoriesPath(user.uid)}/${data.categoryId}`);
      if (!cat) data.categoryId = null;
    }
    const now = Date.now();
    const fields = {
      name: data.name,
      description: data.description,
      price: data.price,
      priceFrom: data.priceFrom && data.price != null,
      availability: data.availability,
      visible: data.visible,
      categoryId: data.categoryId,
      images: data.images.map(({ path, url }) => ({ path, url })),
      options: (data.options ?? []).map((o) => ({ name: o.name, values: o.values })),
      updatedAt: now,
    };

    if (data.id) {
      const id = data.id;
      const current = await db.get<Product>(`${productsPath(user.uid)}/${id}`);
      if (!current) throw new UserError("Ese producto ya no existe.");
      const slug = current.name === data.name ? current.slug : await uniqueProductSlug(user.uid, data.name, id);
      await db.update(`${productsPath(user.uid)}/${id}`, { ...fields, slug });
      const kept = new Set(fields.images.map((i) => i.path));
      await removeImages(current.images.filter((i) => !kept.has(i.path)).map((i) => i.path));
      refreshStore(store.slug);
      return { id };
    }

    const id = db.newId();
    const slug = await uniqueProductSlug(user.uid, data.name);
    await db.tx(async (tx) => {
      const s = await tx.get<Store>(storePath(user.uid));
      if (!s) throw new UserError("Primero crea tu tienda.");
      if ((s.counts?.products ?? 0) >= limits.products) {
        throw new UserError(`Llegaste a ${limits.products} productos, el máximo del plan gratis. Borra uno para agregar otro.`);
      }
      tx.set(`${productsPath(user.uid)}/${id}`, { ...fields, slug, order: now, createdAt: now });
      tx.update(storePath(user.uid), { "counts.products": increment(1), updatedAt: now });
    });
    refreshStore(store.slug);
    return { id };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    let images: string[] = [];
    let slug = "";
    await db.tx(async (tx) => {
      const product = await tx.get<Product>(`${productsPath(user.uid)}/${id}`);
      const store = await tx.get<Store>(storePath(user.uid));
      if (!product || !store) return;
      images = product.images.map((i) => i.path);
      slug = store.slug;
      tx.delete(`${productsPath(user.uid)}/${id}`);
      tx.update(storePath(user.uid), { "counts.products": increment(-1), updatedAt: Date.now() });
    });
    await removeImages(images);
    refreshStore(slug);
    return undefined;
  });
}

export async function setAvailability(id: string, availability: Availability): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    if (!["available", "soldout", "onrequest"].includes(availability)) throw new UserError("Opción no válida.");
    const db = await getDb();
    const product = await db.get<Product>(`${productsPath(user.uid)}/${id}`);
    if (!product) throw new UserError("Ese producto ya no existe.");
    await db.update(`${productsPath(user.uid)}/${id}`, { availability, updatedAt: Date.now() });
    const store = await getStore(user.uid);
    refreshStore(store?.slug);
    return undefined;
  });
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    const existing = new Set((await db.list<Product>(productsPath(user.uid))).map((p) => p.id));
    const updates = ids.filter((id) => existing.has(id)).map((id, i) => ({ path: `${productsPath(user.uid)}/${id}`, data: { order: i } }));
    await db.batchUpdate(updates);
    const store = await getStore(user.uid);
    refreshStore(store?.slug);
    return undefined;
  });
}

/** Crea una copia oculta de un producto (con sus fotos) al final de la lista. */
export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    const source = await db.get<Product>(`${productsPath(user.uid)}/${id}`);
    if (!source) throw new UserError("Ese producto ya no existe.");
    const limits = await getLimits();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    if ((store.counts?.products ?? 0) >= limits.products) {
      throw new UserError(`Llegaste a ${limits.products} productos, el máximo del plan gratis. Borra uno para duplicar.`);
    }
    const newId = db.newId();
    const stamp = Date.now().toString(36);
    const copies: ImageRef[] = [];
    for (const [i, img] of source.images.entries()) {
      const copy = await copyImage(user.uid, img, `${stamp}-${newId.slice(0, 6)}${i}.webp`);
      if (copy) copies.push(copy);
    }
    const suffix = " (copia)";
    const name = `${source.name.slice(0, 60 - suffix.length)}${suffix}`;
    const slug = await uniqueProductSlug(user.uid, name);
    const now = Date.now();
    try {
      await db.tx(async (tx) => {
        const s = await tx.get<Store>(storePath(user.uid));
        if (!s) throw new UserError("Primero crea tu tienda.");
        if ((s.counts?.products ?? 0) >= limits.products) throw new UserError(`Llegaste a ${limits.products} productos, el máximo del plan gratis.`);
        tx.set(`${productsPath(user.uid)}/${newId}`, {
          name,
          slug,
          description: source.description,
          price: source.price,
          priceFrom: source.priceFrom,
          availability: source.availability,
          visible: false,
          categoryId: source.categoryId,
          images: copies,
          options: source.options ?? [],
          order: now,
          createdAt: now,
          updatedAt: now,
        });
        tx.update(storePath(user.uid), { "counts.products": increment(1), updatedAt: now });
      });
    } catch (err) {
      await removeImages(copies.map((c) => c.path));
      throw err;
    }
    refreshStore(store.slug);
    return { id: newId };
  });
}

export type BulkOp =
  | { type: "availability"; value: Availability }
  | { type: "visible"; value: boolean }
  | { type: "category"; categoryId: string | null }
  | { type: "delete" };

const BULK_MAX = 100;

/** Una misma acción sobre varios productos a la vez. */
export async function bulkProducts(ids: string[], op: BulkOp): Promise<ActionResult<{ count: number }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const unique = [...new Set(ids)].slice(0, BULK_MAX);
    if (unique.length === 0) throw new UserError("Elige al menos un producto.");
    const db = await getDb();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const existing = new Map((await db.list<Product>(productsPath(user.uid))).map((p) => [p.id, p]));
    const targets = unique.filter((id) => existing.has(id));
    if (targets.length === 0) throw new UserError("Esos productos ya no existen.");
    const now = Date.now();

    if (op.type === "delete") {
      const images = targets.flatMap((id) => existing.get(id)!.images.map((i) => i.path));
      await db.tx(async (tx) => {
        const s = await tx.get<Store>(storePath(user.uid));
        if (!s) return;
        for (const id of targets) tx.delete(`${productsPath(user.uid)}/${id}`);
        tx.update(storePath(user.uid), { "counts.products": increment(-targets.length), updatedAt: now });
      });
      await removeImages(images);
    } else {
      let data: Record<string, unknown>;
      if (op.type === "availability") {
        if (!["available", "soldout", "onrequest"].includes(op.value)) throw new UserError("Opción no válida.");
        data = { availability: op.value };
      } else if (op.type === "visible") {
        data = { visible: Boolean(op.value) };
      } else if (op.type === "category") {
        if (op.categoryId && !(await db.get(`${categoriesPath(user.uid)}/${op.categoryId}`))) throw new UserError("Esa categoría ya no existe.");
        data = { categoryId: op.categoryId ?? null };
      } else {
        throw new UserError("Acción no válida.");
      }
      await db.batchUpdate(targets.map((id) => ({ path: `${productsPath(user.uid)}/${id}`, data: { ...data, updatedAt: now } })));
    }
    refreshStore(store.slug);
    return { count: targets.length };
  });
}
