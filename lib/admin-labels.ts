import type { SubscriptionStatus } from "@/lib/types";

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  free: "Gratis",
  trial: "Prueba",
  active: "Activa",
  past_due: "Vencida",
  canceled: "Cancelada",
};

export const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  free: "bg-cloud text-ink",
  trial: "bg-amber-100 text-amber-900",
  active: "bg-emerald-100 text-emerald-900",
  past_due: "bg-red-100 text-red-900",
  canceled: "bg-zinc-200 text-zinc-700",
};

const date = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fmtDate = (ms: number | null | undefined) => (ms ? date.format(new Date(ms)) : "—");
export const toInputDate = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");

export function daysUntil(ms: number, now = Date.now()) {
  return Math.ceil((ms - now) / 86_400_000);
}

/** Planes de Space (nombres definitivos). «Gratis» es el nombre histórico del plan sin pago. */
export const PLAN_OPTIONS = ["Satélite", "Cohete", "Estación"] as const;

/** Visitas por mes a partir de las cuales se revisa el uso (uso justo). Solo orientativo: la decisión siempre es de una persona. */
export const FAIR_USE: Record<string, number> = { Satélite: 3000, Cohete: 15000, Estación: 35000 };
export const fairThreshold = (planName: string) => FAIR_USE[planName] ?? FAIR_USE.Satélite;

/** Nivel de exceso: 0 sin exceso, 1 = superó el umbral, 3 = triplicó, 5 = quintuplicó. */
export function fairLevel(views: number, planName: string): 0 | 1 | 3 | 5 {
  const r = views / fairThreshold(planName);
  return r >= 5 ? 5 : r >= 3 ? 3 : r >= 1 ? 1 : 0;
}
