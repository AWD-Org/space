"use server";

import { getDb } from "@/lib/db";
import { isLocalMode } from "@/lib/env";
import { requireUserForAction } from "@/lib/auth/session";
import { categoriesPath, getStore, listProducts, productsPath, slugPath, statsPath, storePath } from "@/lib/data/queries";
import { removeImages } from "@/lib/storage/server";
import type { ActionResult } from "@/lib/types";
import { DELETE_PHRASE, PAUSE_OPTIONS } from "@/lib/account-options";
import { refreshStore, run, UserError } from "./helpers";


/** Pausa la tienda unos días: el catálogo sigue en línea pero sin tomar pedidos, y se reactiva sola. */
export async function pauseStore(days: number): Promise<ActionResult<{ until: number }>> {
  return run(async () => {
    const user = await requireUserForAction();
    if (!PAUSE_OPTIONS.includes(days as (typeof PAUSE_OPTIONS)[number])) throw new UserError("Elige 30, 60 o 90 días.");
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const until = Date.now() + days * 86_400_000;
    const db = await getDb();
    await db.update(storePath(user.uid), { pausedUntil: until, updatedAt: Date.now() });
    refreshStore(store.slug);
    return { until };
  });
}

export async function resumeStore(): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const db = await getDb();
    await db.update(storePath(user.uid), { pausedUntil: null, updatedAt: Date.now() });
    refreshStore(store.slug);
    return undefined;
  });
}

/** Borra para siempre la tienda, productos, categorías, estadísticas, imágenes y la cuenta. */
export async function deleteAccount(phrase: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    if (phrase.trim().toUpperCase() !== DELETE_PHRASE) throw new UserError(`Escribe ${DELETE_PHRASE} para confirmar.`);
    const db = await getDb();
    const store = await getStore(user.uid);
    if (store) {
      const products = await listProducts(user.uid);
      const paths = [...products.flatMap((p) => p.images.map((i) => i.path)), ...(store.logo ? [store.logo.path] : [])];
      await removeImages(paths);
      const [cats, stats] = await Promise.all([db.list<{ id: string }>(categoriesPath(user.uid)), db.list<{ id: string }>(statsPath(user.uid))]);
      await Promise.all([
        ...products.map((p) => db.delete(`${productsPath(user.uid)}/${p.id}`)),
        ...cats.map((c) => db.delete(`${categoriesPath(user.uid)}/${c.id}`)),
        ...stats.map((s) => db.delete(`${statsPath(user.uid)}/${s.id}`)),
      ]);
      await db.delete(slugPath(store.slug));
      await db.delete(storePath(user.uid));
      refreshStore(store.slug);
    }
    if (!isLocalMode) {
      const { adminAuth } = await import("@/lib/firebase/admin");
      await adminAuth().deleteUser(user.uid).catch((e: { code?: string }) => {
        if (e?.code !== "auth/user-not-found") throw e;
      });
    }
    return undefined;
  });
}
