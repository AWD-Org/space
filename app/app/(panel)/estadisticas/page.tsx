import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getStats, getStore, listProducts } from "@/lib/data/queries";
import { todayKey } from "@/lib/format";
import { PageHeader, Panel } from "@/components/app/shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Estadísticas" };
const RANGES = [7, 30, 90] as const;
const dayFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const user = await requireUser();
  const { dias } = await searchParams;
  const range = (RANGES as readonly number[]).includes(Number(dias)) ? Number(dias) : 30;
  const [store, products, stats] = await Promise.all([getStore(user.uid), listProducts(user.uid), getStats(user.uid, range)]);
  if (!store) return null;

  const days = Array.from({ length: range }, (_, i) => todayKey(new Date(Date.now() - (range - 1 - i) * 86_400_000)));
  const byDay = new Map(stats.map((s) => [s.date, s]));
  const series = days.map((d) => ({ date: d, views: byDay.get(d)?.views ?? 0, orders: byDay.get(d)?.ordersSent ?? 0 }));
  const views = series.reduce((n, d) => n + d.views, 0);
  const orders = series.reduce((n, d) => n + d.orders, 0);
  const rate = views ? Math.round((orders / views) * 1000) / 10 : 0;
  const maxViews = Math.max(1, ...series.map((d) => d.views));
  const best = series.reduce((a, b) => (b.views > a.views ? b : a), series[0]);

  const pv = new Map<string, number>();
  for (const s of stats) for (const [id, n] of Object.entries(s.productViews ?? {})) pv.set(id, (pv.get(id) ?? 0) + n);
  const top = [...pv.entries()]
    .map(([id, n]) => ({ product: products.find((p) => p.id === id), n }))
    .filter((x) => x.product)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title="Estadísticas"
        description="Qué tanto se ve tu catálogo y cuántos pedidos salen de él."
        action={
          <nav aria-label="Periodo" className="flex gap-1 rounded-full bg-cloud p-1">
            {RANGES.map((r) => (
              <Link key={r} href={`/app/estadisticas?dias=${r}`} aria-current={r === range ? "page" : undefined} className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium", r === range ? "bg-white text-ink shadow-sm" : "text-muted-foreground hover:text-ink")}>
                {r} días
              </Link>
            ))}
          </nav>
        }
      />
      <div className="grid grid-cols-1 gap-4">
        <Panel>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Visitas</dt>
              <dd className="font-display text-4xl font-semibold tabular-nums text-ink">{views}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Pedidos enviados</dt>
              <dd className="font-display text-4xl font-semibold tabular-nums text-ink">{orders}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">De cada 100 visitas, piden</dt>
              <dd className="font-display text-4xl font-semibold tabular-nums text-ink">{rate}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title={`Visitas por día, últimos ${range} días`}>
          <div className="flex h-36 items-end gap-[2px]" role="img" aria-label={`Visitas por día, últimos ${range} días`}>
            {series.map((d) => (
              <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${dayFmt.format(new Date(d.date + "T12:00:00"))}: ${d.views} visitas, ${d.orders} pedidos`}>
                <div className={cn("rounded-t-[2px]", d.views ? "bg-spaceBlue" : "bg-cloud")} style={{ height: `${Math.max(4, (d.views / maxViews) * 100)}%` }} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {views ? `Tu mejor día fue el ${dayFmt.format(new Date(best.date + "T12:00:00"))}, con ${best.views} visitas.` : "Todavía no hay visitas en este periodo. Comparte tu link para empezar."} Un pedido enviado es cuando alguien toca “Mandar pedido por WhatsApp”.
          </p>
        </Panel>
        <Panel title="Productos más vistos">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cuando alguien abra tus productos, aquí verás cuáles llaman más la atención.</p>
          ) : (
            <ol className="divide-y divide-ink/5">
              {top.map(({ product, n }, i) => (
                <li key={product!.id} className="flex items-center justify-between gap-3 py-2.5 text-[0.95rem]">
                  <span className="min-w-0 truncate text-ink">
                    <span className="mr-2 tabular-nums text-muted-foreground">{i + 1}.</span>
                    {product!.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{n} {n === 1 ? "vista" : "vistas"}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
