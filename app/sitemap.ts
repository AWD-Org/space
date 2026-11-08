import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { backendReady, getDb } from "@/lib/db";
import { productsPath } from "@/lib/data/queries";
import type { Product, Store } from "@/lib/types";

export const revalidate = 3600;

/** Límite del protocolo sitemap (50 000 URLs por archivo). */
const MAX_URLS = 50_000;
const BATCH = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/registro`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
  if (!backendReady()) return base;
  try {
    const db = await getDb();
    const stores = await db.list<Store>("stores", { where: [["status", "==", "published"]], limit: 1000 });
    const urls: MetadataRoute.Sitemap = stores.map((s) => ({ url: `${SITE_URL}/${s.slug}`, lastModified: new Date(s.updatedAt), changeFrequency: "daily" as const, priority: 0.7 }));
    // Páginas de producto: se leen por lotes para no saturar la base.
    for (let i = 0; i < stores.length && base.length + urls.length < MAX_URLS; i += BATCH) {
      const chunk = stores.slice(i, i + BATCH);
      const lists = await Promise.all(
        chunk.map((s) => db.list<Product>(productsPath(s.id), { where: [["visible", "==", true]], limit: 500 }).catch(() => [] as Product[]))
      );
      chunk.forEach((s, k) => {
        for (const p of lists[k]) {
          if (!p.slug) continue;
          urls.push({ url: `${SITE_URL}/${s.slug}/p/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.5 });
        }
      });
    }
    return [...base, ...urls].slice(0, MAX_URLS);
  } catch {
    return base;
  }
}
