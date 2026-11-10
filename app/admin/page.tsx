import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getAllStores, getPlatformStats, summarize } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";
import { PageHeader, Panel } from "@/components/app/shell";
import { STATUS_LABEL, STATUS_STYLE, daysUntil, fmtDate } from "@/lib/admin-labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Resumen" };
const RANGES = [7, 30, 90] as const;

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  await requireAdmin();
  const { dias } = await searchParams;
  const range = (RANGES as readonly number[]).includes(Number(dias)) ? Number(dias) : 30;
  const [stores, stats] = await Promise.all([getAllStores(), getPlatformStats(range)]);
  const sum = summarize(stores);
  const views = stats.days.reduce((n, d) => n + d.views, 0);
  const orders = stats.days.reduce((n, d) => n + d.orders, 0);
  const maxViews = Math.max(1, ...stats.days.map((d) => d.views));
  const byId = new Map(stores.map((s) => [s.id, s]));
  const top = [...stats.perStore].sort((a, b) => b.views - a.views).filter((t) => t.views > 0).slice(0, 10);
  const dayFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

  return (
    <>
      <PageHeader title="Resumen" description="Cuentas, suscripciones y actividad de toda la plataforma." />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cuentas" value={sum.total} hint={`+${sum.new7} esta semana · +${sum.new30} en 30 días`} />
        <Stat label="Tiendas publicadas" value={sum.published} hint={`${sum.draft} en borrador`} />
        <Stat label="Productos en total" value={sum.products} />
        <Stat label="Ingreso mensual (activas)" value={formatPrice(sum.mrrCents)} hint="Suma de los montos de suscripciones activas" />
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Suscripciones">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(sum.subs) as (keyof typeof sum.subs)[]).map((k) => (
              <li key={k} className={cn("rounded-xl px-3 py-2.5 text-center", STATUS_STYLE[k])}>
                <p className="font-display text-2xl font-semibold tabular-nums">{sum.subs[k]}</p>
                <p className="text-xs font-medium">{STATUS_LABEL[k]}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Altas por día, últimos 30 días">
          <div className="flex h-24 items-end gap-[2px]" role="img" aria-label="Cuentas nuevas por día, últimos 30 días">
            {sum.signups.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.n}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(d.n ? 8 : 2, (d.n / Math.max(1, ...sum.signups.map((x) => x.n))) * 100)}%` }} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Renovaciones vencidas" description="Suscripciones cuya fecha ya pasó.">
          {sum.overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguna.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {sum.overdue.map(({ store, at }) => (
                <li key={store.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0"><Link href={`/admin/usuarios?q=${encodeURIComponent(store.slug)}`} className="font-medium text-ink hover:underline">{store.name}</Link><span className="block truncate text-muted-foreground">{store.ownerEmail}</span></span>
                  <span className="shrink-0 text-right text-red-700">{fmtDate(at)}<span className="block text-xs">hace {Math.abs(daysUntil(at))} d</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Próximas renovaciones" description="En los siguientes 30 días.">
          {sum.soon.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguna.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {sum.soon.map(({ store, at }) => (
                <li key={store.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0"><Link href={`/admin/usuarios?q=${encodeURIComponent(store.slug)}`} className="font-medium text-ink hover:underline">{store.name}</Link><span className="block truncate text-muted-foreground">{store.subscription?.planName} · {store.ownerEmail}</span></span>
                  <span className="shrink-0 text-right">{fmtDate(at)}<span className="block text-xs text-muted-foreground">en {daysUntil(at)} d</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8">
        <PageHeader
          title="Actividad"
          description="Visitas y pedidos enviados desde todos los catálogos."
          action={
            <nav aria-label="Periodo" className="flex gap-1 rounded-full bg-cloud p-1">
              {RANGES.map((r) => (
                <Link key={r} href={`/admin?dias=${r}`} aria-current={r === range ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-sm font-medium", r === range ? "bg-white text-ink shadow-sm" : "text-muted-foreground hover:text-ink")}>
                  {r} días
                </Link>
              ))}
            </nav>
          }
        />
        <Panel>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div><dt className="text-sm text-muted-foreground">Visitas</dt><dd className="font-display text-4xl font-semibold tabular-nums text-ink">{views}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Pedidos enviados</dt><dd className="font-display text-4xl font-semibold tabular-nums text-ink">{orders}</dd></div>
            <div><dt className="text-sm text-muted-foreground">De cada 100 visitas, piden</dt><dd className="font-display text-4xl font-semibold tabular-nums text-ink">{views ? Math.round((orders / views) * 1000) / 10 : 0}</dd></div>
          </dl>
          <div className="mt-6 flex h-32 items-end gap-[2px]" role="img" aria-label={`Visitas por día, últimos ${range} días`}>
            {stats.days.map((d) => (
              <div key={d.date} title={`${dayFmt.format(new Date(d.date + "T12:00:00"))}: ${d.views} visitas, ${d.orders} pedidos`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(d.views ? 4 : 1, (d.views / maxViews) * 100)}%` }} />
            ))}
          </div>
        </Panel>
        <Panel title="Tiendas más visitadas" className="mt-4">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay visitas en este periodo.</p>
          ) : (
            <ol className="divide-y divide-ink/5">
              {top.map((t) => {
                const s = byId.get(t.id);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{s ? <Link href={`/${s.slug}`} className="font-medium text-ink hover:underline">{s.name}</Link> : t.id}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{t.views} visitas · {t.orders} pedidos</span>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
