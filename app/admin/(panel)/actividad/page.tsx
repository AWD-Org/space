import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { PageHeader, Panel } from "@/components/app/shell";

export const metadata: Metadata = { title: "Actividad" };

const LABEL: Record<string, string> = {
  code_ok: "Acceso correcto",
  code_failed: "Código incorrecto",
  locked: "Bloqueo por intentos",
  logout: "Cierre de sesión admin",
  setSubscription: "Suscripción editada",
  setStoreState: "Estado de tienda cambiado",
};
const BAD = new Set(["code_failed", "locked"]);
const fmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "medium", timeZone: "America/Mexico_City" });

type Row = { at: number; by: string; action: string; storeId: string | null; detail: Record<string, unknown> };

export default async function AdminActivity() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.list<Row>("adminLog", { orderBy: ["at", "desc"], limit: 100 });
  return (
    <>
      <PageHeader title="Actividad" description="Accesos y cambios hechos desde el admin. Se muestran los últimos 100." />
      <Panel>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay actividad.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {rows.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={BAD.has(r.action) ? "font-semibold text-red-700" : "font-medium text-ink"}>{LABEL[r.action] ?? r.action}</span>
                  <span className="text-muted-foreground">{fmt.format(new Date(r.at))}</span>
                  <span className="text-muted-foreground">{r.by}</span>
                </div>
                {(r.storeId || (r.detail && Object.keys(r.detail).length > 0)) && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {r.storeId ? `Tienda ${r.storeId} · ` : ""}
                    {r.detail ? JSON.stringify(r.detail) : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
