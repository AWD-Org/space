import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getAllStores, effectiveSub } from "@/lib/data/admin";
import { formatPrice, centsToInput } from "@/lib/format";
import { PageHeader, Panel } from "@/components/app/shell";
import { UserAdmin } from "@/components/admin/user-admin";
import { STATUS_LABEL, STATUS_STYLE, fmtDate, toInputDate } from "@/lib/admin-labels";
import type { SubscriptionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Usuarios" };
const PAGE = 50;
const FILTERS = ["todas", "free", "trial", "active", "past_due", "canceled"] as const;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; p?: string }> }) {
  await requireAdmin();
  const { q = "", estado = "todas", p = "1" } = await searchParams;
  const stores = await getAllStores();
  const needle = q.trim().toLowerCase().slice(0, 80);
  const filter = (FILTERS as readonly string[]).includes(estado) ? estado : "todas";
  const rows = stores.filter((s) => {
    if (filter !== "todas" && effectiveSub(s).status !== filter) return false;
    if (!needle) return true;
    return [s.name, s.slug, s.ownerEmail ?? "", s.whatsapp].some((v) => v.toLowerCase().includes(needle));
  });
  const page = Math.max(1, Math.min(Number(p) || 1, Math.ceil(rows.length / PAGE) || 1));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const href = (over: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(needle ? { q: needle } : {}), ...(filter !== "todas" ? { estado: filter } : {}), ...over });
    return `/admin/usuarios?${sp.toString()}`;
  };

  return (
    <>
      <PageHeader title="Usuarios" description={`${rows.length} de ${stores.length} cuentas. Cada cuenta tiene una tienda.`} />
      <form action="/admin/usuarios" className="mb-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="q">Buscar</label>
        <input id="q" name="q" defaultValue={q} placeholder="Nombre, link, correo o WhatsApp" maxLength={80} className="h-11 min-w-0 flex-1 rounded-full border border-input bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
        {filter !== "todas" && <input type="hidden" name="estado" value={filter} />}
        <button className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-medium text-white hover:bg-[#2F47CC]">Buscar</button>
      </form>
      <nav aria-label="Estado de suscripción" className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link key={f} href={href({ estado: f })} aria-current={f === filter ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium", f === filter ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-inset ring-border hover:bg-cloud")}>
            {f === "todas" ? "Todas" : STATUS_LABEL[f as SubscriptionStatus]}
          </Link>
        ))}
      </nav>
      <Panel>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay cuentas con esos filtros.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {shown.map((s) => {
              const sub = effectiveSub(s);
              return (
                <li key={s.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link href={`/${s.slug}`} className="font-medium text-ink hover:underline">{s.name}</Link>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[sub.status])}>{STATUS_LABEL[sub.status]}</span>
                        <span className="rounded-full bg-cloud px-2.5 py-0.5 text-xs text-muted-foreground">{s.status === "published" ? "Publicada" : "Borrador"}</span>
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{s.ownerEmail ?? "Sin correo"} · /{s.slug}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.counts?.products ?? 0} productos · alta {fmtDate(s.createdAt)} · plan {sub.planName}
                        {sub.renewsAt ? ` · renueva ${fmtDate(sub.renewsAt)}` : ""}
                        {sub.amountCents ? ` · ${formatPrice(sub.amountCents)}` : ""}
                      </p>
                      {sub.note && <p className="mt-1 text-xs text-muted-foreground">Nota: {sub.note}</p>}
                    </div>
                    <UserAdmin u={{ id: s.id, name: s.name, slug: s.slug, status: s.status, isOpen: s.isOpen, planName: sub.planName, subStatus: sub.status, renewsOn: toInputDate(sub.renewsAt), amount: sub.amountCents ? centsToInput(sub.amountCents) : "", note: sub.note }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {rows.length > PAGE && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link className="inline-flex min-h-11 items-center font-medium text-blueInk hover:underline" href={href({ p: String(page - 1) })}>← Anterior</Link> : <span />}
          <span className="text-muted-foreground">Página {page} de {Math.ceil(rows.length / PAGE)}</span>
          {page * PAGE < rows.length ? <Link className="inline-flex min-h-11 items-center font-medium text-blueInk hover:underline" href={href({ p: String(page + 1) })}>Siguiente →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
