import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { statsPath } from "@/lib/data/queries";
import { todayKey } from "@/lib/format";
import type { DayStats, Store } from "@/lib/types";

export const ADMIN_TAG = "admin-data";
const DAY = 86_400_000;
const MAX_STORES = 2000;
const BATCH = 15;

async function loadStores(): Promise<Store[]> {
  const db = await getDb();
  return db.list<Store>("stores", { orderBy: ["createdAt", "desc"], limit: MAX_STORES });
}

const cachedStores = unstable_cache(loadStores, ["admin-stores"], { tags: [ADMIN_TAG], revalidate: 60 });

/**
 * Todas las tiendas (una por cuenta). Caché corta: el panel no necesita tiempo real.
 * Cada lectura exige superadmin: layout y página se renderizan en paralelo, así que el layout solo no basta para no filtrar datos.
 */
export async function getAllStores(): Promise<Store[]> {
  await requireAdmin();
  return cachedStores();
}

export type StoreTotals = { id: string; views: number; orders: number };
export type PlatformStats = { days: { date: string; views: number; orders: number }[]; perStore: StoreTotals[] };

async function loadPlatformStats(days: number): Promise<PlatformStats> {
  const db = await getDb();
  const stores = await cachedStores();
  const since = todayKey(new Date(Date.now() - (days - 1) * DAY));
  const perDay = new Map<string, { views: number; orders: number }>();
  const perStore: StoreTotals[] = [];
  for (let i = 0; i < stores.length; i += BATCH) {
    const chunk = stores.slice(i, i + BATCH);
    const rows = await Promise.all(
      chunk.map((s) => db.list<DayStats>(statsPath(s.id), { where: [["date", ">=", since]] }).catch(() => [] as DayStats[]))
    );
    chunk.forEach((s, k) => {
      let views = 0;
      let orders = 0;
      for (const d of rows[k]) {
        views += d.views ?? 0;
        orders += d.ordersSent ?? 0;
        const cur = perDay.get(d.date) ?? { views: 0, orders: 0 };
        cur.views += d.views ?? 0;
        cur.orders += d.ordersSent ?? 0;
        perDay.set(d.date, cur);
      }
      perStore.push({ id: s.id, views, orders });
    });
  }
  const series = Array.from({ length: days }, (_, i) => {
    const date = todayKey(new Date(Date.now() - (days - 1 - i) * DAY));
    return { date, views: perDay.get(date)?.views ?? 0, orders: perDay.get(date)?.orders ?? 0 };
  });
  return { days: series, perStore };
}

export async function getPlatformStats(days: number): Promise<PlatformStats> {
  await requireAdmin();
  return unstable_cache(() => loadPlatformStats(days), ["admin-stats", String(days)], { tags: [ADMIN_TAG], revalidate: 300 })();
}

/** Estado efectivo de una cuenta: sin suscripción guardada es gratis. */
export function effectiveSub(s: Store) {
  return s.subscription ?? { planName: "Gratis", status: "free" as const, renewsAt: null, amountCents: null, note: "", updatedAt: 0 };
}

export function summarize(stores: Store[], now = Date.now()) {
  const total = stores.length;
  const published = stores.filter((s) => s.status === "published").length;
  const paused = stores.filter((s) => typeof s.pausedUntil === "number" && s.pausedUntil > now).length;
  const closed = stores.filter((s) => s.status === "published" && !s.isOpen).length;
  const created = (days: number) => stores.filter((s) => s.createdAt >= now - days * DAY).length;
  const products = stores.reduce((n, s) => n + (s.counts?.products ?? 0), 0);
  const subs = { free: 0, trial: 0, active: 0, past_due: 0, canceled: 0 };
  let mrrCents = 0;
  for (const s of stores) {
    const sub = effectiveSub(s);
    subs[sub.status]++;
    if (sub.status === "active" && sub.amountCents) mrrCents += sub.amountCents;
  }
  const renewals = stores
    .filter((s) => s.subscription && ["active", "trial", "past_due"].includes(s.subscription.status) && s.subscription.renewsAt != null)
    .map((s) => ({ store: s, at: s.subscription!.renewsAt as number }))
    .sort((a, b) => a.at - b.at);
  const overdue = renewals.filter((r) => r.at < now);
  const soon = renewals.filter((r) => r.at >= now && r.at <= now + 30 * DAY);
  const signups = Array.from({ length: 30 }, (_, i) => {
    const date = todayKey(new Date(now - (29 - i) * DAY));
    return { date, n: stores.filter((s) => todayKey(new Date(s.createdAt)) === date).length };
  });
  return { total, published, draft: total - published, paused, closed, new7: created(7), new30: created(30), products, subs, mrrCents, overdue, soon, signups };
}
