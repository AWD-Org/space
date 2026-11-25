import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { effectiveSub, getAllStores, getPlatformStats } from "@/lib/data/admin";
import { PageHeader, Panel } from "@/components/app/shell";
import { fairLevel, fairThreshold } from "@/lib/admin-labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Uso justo" };

const LEVEL_STYLE = {
  0: "bg-cloud text-ink",
  1: "bg-amber-100 text-amber-900",
  3: "bg-orange-200 text-orange-950",
  5: "bg-red-100 text-red-900",
} as const;
const LEVEL_NOTE = { 0: "Normal", 1: "1× · pasó el umbral", 3: "3× · escribirle", 5: "5× · evaluar pausa" } as const;

/** Vista manual: visitas del mes por tienda frente al umbral de su plan. Sin correos ni tareas automáticas. */
export default async function AdminUsage() {
  await requireAdmin();
  const day = new Date().getUTCDate();
  const [stores, stats] = await Promise.all([getAllStores(), getPlatformStats(day)]);
  const views = new Map(stats.perStore.map((t) => [t.id, t.views]));
  const rows = stores
    .map((s) => {
      const sub = effectiveSub(s);
      const v = views.get(s.id) ?? 0;
      const limit = fairThreshold(sub.planName);
      return { s, sub, v, limit, ratio: v / limit, level: fairLevel(v, sub.planName) };
    })
    .filter((r) => r.v > 0)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 100);
  const flagged = rows.filter((r) => r.level > 0).length;

  return (
    <>
      <PageHeader
        title="Uso justo"
        description={`Visitas de este mes (${day} ${day === 1 ? "día" : "días"}) frente al umbral de cada plan. ${flagged} cuenta${flagged === 1 ? "" : "s"} con exceso. La decisión siempre es tuya.`}
      />
      <Panel>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay visitas este mes.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {rows.map(({ s, sub, v, limit, ratio, level }) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/${s.slug}`} className="font-medium text-ink hover:underline">{s.name}</Link>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", LEVEL_STYLE[level])}>{LEVEL_NOTE[level]}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{s.ownerEmail ?? "Sin correo"} · plan {sub.planName}{sub.courtesy ? " (cortesía)" : ""}</p>
                </div>
                <p className="text-right text-sm tabular-nums">
                  <span className="font-display text-lg font-semibold text-ink">{v.toLocaleString("es-MX")}</span>
                  <span className="text-muted-foreground"> / {limit.toLocaleString("es-MX")} · {ratio.toFixed(1)}×</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="mt-3 text-xs text-muted-foreground">Umbrales por mes: Satélite 3,000 · Cohete 15,000 · Estación 35,000. Las cuentas sin plan asignado se miden como Satélite.</p>
    </>
  );
}
