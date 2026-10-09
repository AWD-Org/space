import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { FREE_PLAN, type PlanLimits } from "@/lib/plan";
import { todayKey } from "@/lib/format";
import type { Category, DayStats, Product, Store } from "@/lib/types";

export const storePath = (uid: string) => `stores/${uid}`;
export const productsPath = (uid: string) => `stores/${uid}/products`;
export const categoriesPath = (uid: string) => `stores/${uid}/categories`;
export const statsPath = (uid: string) => `stores/${uid}/stats`;
export const slugPath = (slug: string) => `slugs/${slug}`;

export const catalogTag = (slug: string) => `catalog-${slug}`;

export async function getStore(uid: string) {
  const db = await getDb();
  return db.get<Store>(storePath(uid));
}

export async function listProducts(uid: string) {
  const db = await getDb();
  return db.list<Product>(productsPath(uid), { orderBy: ["order", "asc"] });
}

export async function getProduct(uid: string, id: string) {
  const db = await getDb();
  return db.get<Product>(`${productsPath(uid)}/${id}`);
}

export async function listCategories(uid: string) {
  const db = await getDb();
  return db.list<Category>(categoriesPath(uid), { orderBy: ["order", "asc"] });
}

export const getLimits = unstable_cache(
  async (): Promise<PlanLimits> => {
    try {
      const db = await getDb();
      const override = await db.get<Partial<PlanLimits>>("config/plan_free");
      if (!override) return FREE_PLAN;
      const { id: _id, ...rest } = override as Partial<PlanLimits> & { id: string };
      return { ...FREE_PLAN, ...rest };
    } catch {
      return FREE_PLAN;
    }
  },
  ["plan-free"],
  { revalidate: 600, tags: ["plan"] }
);

export interface PublicCatalog {
  store: Store;
  categories: Category[];
  products: Product[];
}

async function loadCatalogBySlug(slug: string, includeDraft: boolean): Promise<PublicCatalog | null> {
  const db = await getDb();
  const ref = await db.get<{ storeId: string }>(slugPath(slug));
  if (!ref) return null;
  const store = await db.get<Store>(storePath(ref.storeId));
  if (!store || (store.status !== "published" && !includeDraft)) return null;
  const [categories, products] = await Promise.all([
    db.list<Category>(categoriesPath(store.id), { orderBy: ["order", "asc"] }),
    db.list<Product>(productsPath(store.id), { orderBy: ["order", "asc"] }),
  ]);
  const paused = typeof store.pausedUntil === "number" && store.pausedUntil > Date.now();
  return { store: paused ? { ...store, isOpen: false } : store, categories, products: products.filter((p) => p.visible) };
}

/** Catálogo publicado, en caché hasta que el vendedor cambie algo. */
export function getPublicCatalog(slug: string) {
  return unstable_cache(() => loadCatalogBySlug(slug, false), ["catalog", slug], {
    tags: [catalogTag(slug)],
    revalidate: 3600,
  })();
}

/** Vista del dueño: incluye borradores y no usa caché. */
export function getOwnerCatalog(slug: string) {
  return loadCatalogBySlug(slug, true);
}

export async function getStats(uid: string, days: number) {
  const db = await getDb();
  const since = todayKey(new Date(Date.now() - (days - 1) * 86_400_000));
  return db.list<DayStats>(statsPath(uid), { where: [["date", ">=", since]], orderBy: ["date", "asc"] });
}
