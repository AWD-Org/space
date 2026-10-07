"use server";

import { getDb, increment } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { categoriesPath, getLimits, getStore, productsPath, storePath } from "@/lib/data/queries";
import { categoryNameSchema, firstError } from "@/lib/validators";
import type { ActionResult, Category, Product, Store } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

export async function createCategory(name: string): Promise<ActionResult<Category>> {
  return run(async () => {
    const user = await requireUserForAction();
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const limits = await getLimits();
    const db = await getDb();
    const id = db.newId();
    const now = Date.now();
    let slug = "";
    await db.tx(async (tx) => {
      const store = await tx.get<Store>(storePath(user.uid));
      if (!store) throw new UserError("Primero crea tu tienda.");
      if ((store.counts?.categories ?? 0) >= limits.categories) {
        throw new UserError(`El plan gratis permite ${limits.categories} categorías.`);
      }
      slug = store.slug;
      tx.set(`${categoriesPath(user.uid)}/${id}`, { name: parsed.data, order: now });
      tx.update(storePath(user.uid), { "counts.categories": increment(1), updatedAt: now });
    });
    refreshStore(slug);
    return { id, name: parsed.data, order: now };
  });
}

export async function renameCategory(id: string, name: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const db = await getDb();
    if (!(await db.get(`${categoriesPath(user.uid)}/${id}`))) throw new UserError("Esa categoría ya no existe.");
    await db.update(`${categoriesPath(user.uid)}/${id}`, { name: parsed.data });
    const store = await getStore(user.uid);
    refreshStore(store?.slug);
    return undefined;
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    const products = await db.list<Product>(productsPath(user.uid), { where: [["categoryId", "==", id]] });
    let slug = "";
    await db.tx(async (tx) => {
      const store = await tx.get<Store>(storePath(user.uid));
      const cat = await tx.get(`${categoriesPath(user.uid)}/${id}`);
      if (!store || !cat) return;
      slug = store.slug;
      tx.delete(`${categoriesPath(user.uid)}/${id}`);
      tx.update(storePath(user.uid), { "counts.categories": increment(-1), updatedAt: Date.now() });
    });
    await db.batchUpdate(products.map((p) => ({ path: `${productsPath(user.uid)}/${p.id}`, data: { categoryId: null } })));
    refreshStore(slug);
    return undefined;
  });
}

export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    const existing = new Set((await db.list<Category>(categoriesPath(user.uid))).map((c) => c.id));
    await db.batchUpdate(ids.filter((id) => existing.has(id)).map((id, i) => ({ path: `${categoriesPath(user.uid)}/${id}`, data: { order: i } })));
    const store = await getStore(user.uid);
    refreshStore(store?.slug);
    return undefined;
  });
}
