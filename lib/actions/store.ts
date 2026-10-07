"use server";

import { getDb } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { getLimits, getStore, listProducts, slugPath, storePath } from "@/lib/data/queries";
import { slugProblem, slugify } from "@/lib/slug";
import { createStoreSchema, firstError, updateStoreSchema } from "@/lib/validators";
import type { ActionResult, Store } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

export async function checkSlug(raw: string): Promise<{ available: boolean; message?: string; slug: string }> {
  const slug = slugify(raw);
  const problem = slugProblem(slug);
  if (problem) return { available: false, message: problem, slug };
  const db = await getDb();
  const user = await requireUserForAction();
  const taken = await db.get<{ storeId: string }>(slugPath(slug));
  if (taken && taken.storeId !== user.uid) return { available: false, message: "Ese link ya tiene dueño. Prueba otro.", slug };
  return { available: true, slug };
}

export async function createStore(input: { name: string; slug: string; whatsapp: string }): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const parsed = createStoreSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { name, whatsapp } = parsed.data;
    const slug = slugify(parsed.data.slug || name);
    const problem = slugProblem(slug);
    if (problem) throw new UserError(problem);

    const db = await getDb();
    await db.tx(async (tx) => {
      const existing = await tx.get<Store>(storePath(user.uid));
      const taken = await tx.get<{ storeId: string }>(slugPath(slug));
      if (taken && taken.storeId !== user.uid) throw new UserError("Ese link ya tiene dueño. Prueba otro.");
      const now = Date.now();
      if (existing) {
        // Volver a pasar por el primer paso: actualiza nombre, link y WhatsApp.
        if (existing.slug !== slug) tx.delete(slugPath(existing.slug));
        tx.set(slugPath(slug), { storeId: user.uid });
        tx.update(storePath(user.uid), { name, slug, whatsapp, updatedAt: now });
        return;
      }
      const store: Omit<Store, "id"> = {
        ownerId: user.uid,
        ownerEmail: user.email,
        name,
        slug,
        tagline: "",
        whatsapp,
        deliveryNote: "",
        paymentMethods: ["efectivo", "transferencia"],
        accent: "#3B55E6",
        logo: null,
        isOpen: true,
        status: "draft",
        plan: "free",
        counts: { products: 0, categories: 0 },
        slugChangedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(slugPath(slug), { storeId: user.uid });
      tx.set(storePath(user.uid), store);
    });
    refreshStore(slug);
    return { slug };
  });
}

export async function updateStore(input: Record<string, unknown>): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const parsed = updateStoreSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const db = await getDb();
    await db.update(storePath(user.uid), { ...parsed.data, updatedAt: Date.now() });
    refreshStore(store.slug);
    return undefined;
  });
}

export async function changeSlug(raw: string): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const slug = slugify(raw);
    const problem = slugProblem(slug);
    if (problem) throw new UserError(problem);
    const limits = await getLimits();
    const db = await getDb();
    let oldSlug = "";
    await db.tx(async (tx) => {
      const store = await tx.get<Store>(storePath(user.uid));
      if (!store) throw new UserError("Primero crea tu tienda.");
      oldSlug = store.slug;
      if (store.slug === slug) return;
      const taken = await tx.get<{ storeId: string }>(slugPath(slug));
      if (taken) throw new UserError("Ese link ya tiene dueño. Prueba otro.");
      const waitMs = limits.slugChangeDays * 86_400_000;
      if (store.status === "published" && store.slugChangedAt && Date.now() - store.slugChangedAt < waitMs) {
        const days = Math.ceil((store.slugChangedAt + waitMs - Date.now()) / 86_400_000);
        throw new UserError(`Puedes volver a cambiar tu link en ${days} ${days === 1 ? "día" : "días"}.`);
      }
      tx.delete(slugPath(store.slug));
      tx.set(slugPath(slug), { storeId: user.uid });
      tx.update(storePath(user.uid), {
        slug,
        slugChangedAt: store.status === "published" ? Date.now() : null,
        updatedAt: Date.now(),
      });
    });
    refreshStore(oldSlug);
    refreshStore(slug);
    return { slug };
  });
}

export async function setPublished(published: boolean): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    if (published) {
      const products = await listProducts(user.uid);
      if (!products.some((p) => p.visible)) throw new UserError("Agrega al menos un producto visible antes de publicar.");
    }
    const db = await getDb();
    await db.update(storePath(user.uid), { status: published ? "published" : "draft", updatedAt: Date.now() });
    refreshStore(store.slug);
    return undefined;
  });
}
