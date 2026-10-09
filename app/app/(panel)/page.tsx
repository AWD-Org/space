import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Circle, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStats, getStore, listProducts } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { todayKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/app/shell";
import { StoreStatus } from "@/components/app/store-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inicio" };

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {used} de {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cloud" role="progressbar" aria-label={label} aria-valuenow={used} aria-valuemax={max}>
        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-[#B45309]" : "bg-spaceBlue")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await requireUser();
  const [store, products, limits, stats] = await Promise.all([getStore(user.uid), listProducts(user.uid), getLimits(), getStats(user.uid, 14)]);
  if (!store) return null;

  const url = `${SITE_URL}/${store.slug}`;
  const days = Array.from({ length: 14 }, (_, i) => todayKey(new Date(Date.now() - (13 - i) * 86_400_000)));
  const byDay = new Map(stats.map((s) => [s.date, s]));
  const series = days.map((d) => ({ date: d, views: byDay.get(d)?.views ?? 0, orders: byDay.get(d)?.ordersSent ?? 0 }));
  const last7 = series.slice(7);
  const views7 = last7.reduce((n, d) => n + d.views, 0);
  const orders7 = last7.reduce((n, d) => n + d.orders, 0);
  const maxViews = Math.max(1, ...series.map((d) => d.views));

  const productViews = new Map<string, number>();
  for (const s of stats) for (const [id, n] of Object.entries(s.productViews ?? {})) productViews.set(id, (productViews.get(id) ?? 0) + n);
  const top = [...productViews.entries()]
    .map(([id, n]) => ({ product: products.find((p) => p.id === id), n }))
    .filter((x) => x.product)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const checklist = [
    { done: products.length > 0, label: "Sube tu primer producto", href: "/app/productos/nuevo" },
    { done: Boolean(store.logo), label: "Pon tu logo o una foto tuya", href: "/app/tienda" },
    { done: Boolean(store.deliveryNote), label: "Di dónde y cuándo entregas", href: "/app/tienda" },
    { done: products.length >= 5, label: "Llega a 5 productos", href: "/app/productos/nuevo" },
    { done: store.status === "published", label: "Publica tu catálogo", href: "/app" },
  ];
  const pending = checklist.filter((c) => !c.done);
  const firstName = (user.name ?? "").split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Tu tienda"}
        description={store.name}
        action={
          <Button asChild size="lg" className="hidden lg:inline-flex">
            <Link href="/app/productos/nuevo">
              <Plus />
              Agregar producto
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4">
        <StoreStatus url={url} displayUrl={url.replace(/^https?:\/\//, "")} published={store.status === "published"} isOpen={store.isOpen} canPublish={products.some((p) => p.visible)} />

        {pending.length > 0 && (
          <Panel title="Termina de armar tu catálogo" description={`${checklist.length - pending.length} de ${checklist.length} listos`}>
            <div className="-mt-1 mb-3 h-1.5 overflow-hidden rounded-full bg-cloud" role="progressbar" aria-label="Avance" aria-valuenow={checklist.length - pending.length} aria-valuemax={checklist.length}>
              <div className="h-full rounded-full bg-spaceBlue transition-[width] duration-500" style={{ width: `${((checklist.length - pending.length) / checklist.length) * 100}%` }} />
            </div>
            <ul className="divide-y divide-ink/5">
              {pending.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="group flex items-center gap-3 py-3 text-[0.95rem] text-ink">
                    <Circle className="h-5 w-5 shrink-0 text-spaceLavender" aria-hidden />
                    <span className="flex-1">{c.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Panel title="Últimos 7 días">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Visitas</dt>
                <dd className="font-display text-4xl font-semibold tabular-nums text-ink">{views7}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Pedidos enviados</dt>
                <dd className="font-display text-4xl font-semibold tabular-nums text-ink">{orders7}</dd>
              </div>
            </dl>
            <div className="mt-5 flex h-20 items-end gap-1" aria-label="Visitas por día, últimos 14 días" role="img">
              {series.map((d) => (
                <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.views} visitas`}>
                  <div className={cn("rounded-t-[3px]", d.views ? "bg-spaceBlue" : "bg-cloud")} style={{ height: `${Math.max(6, (d.views / maxViews) * 100)}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Visitas por día, últimas dos semanas. Un pedido enviado es cuando alguien toca “Mandar pedido por WhatsApp”.</p>
          </Panel>

          <Panel title="Lo más visto">
            {top.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cuando compartas tu link, aquí verás qué productos abren más.</p>
            ) : (
              <ol className="space-y-3">
                {top.map(({ product, n }) => (
                  <li key={product!.id} className="flex items-center justify-between gap-3 text-[0.95rem]">
                    <span className="truncate text-ink">{product!.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <Panel title="Tu plan gratis">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Meter label="Productos" used={products.length} max={limits.products} />
            <Meter label="Categorías" used={store.counts?.categories ?? 0} max={limits.categories} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Hasta {limits.imagesPerProduct} fotos por producto. Space no cobra comisión por tus ventas.</p>
        </Panel>
      </div>
    </>
  );
}
