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
