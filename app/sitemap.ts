import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { backendReady, getDb } from "@/lib/db";
import type { Store } from "@/lib/types";

export const revalidate = 3600;

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
    return [...base, ...stores.map((s) => ({ url: `${SITE_URL}/${s.slug}`, lastModified: new Date(s.updatedAt), changeFrequency: "daily" as const, priority: 0.7 }))];
  } catch {
    return base;
  }
}
