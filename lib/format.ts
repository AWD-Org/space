import type { Availability, PaymentMethod } from "./types";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** Centavos a "$45 MXN", "$4,000 MXN" o "$45.50 MXN". Space solo maneja pesos mexicanos. */
export function formatPrice(cents: number | null | undefined, from = false) {
  if (cents == null) return "Precio a consultar";
  const text = `${mxn.format(cents / 100)} MXN`;
  return from ? `Desde ${text}` : text;
}

/** "45.50" o "45" a centavos. */
export function parsePriceInput(value: string): number | null {
  const clean = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** "4000.5" → "4,000.5" (separador de miles mientras escribes). */
export function groupDigits(raw: string): string {
  const [int = "", dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toString();
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Disponible",
  soldout: "Se acabó",
  onrequest: "Sobre pedido",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

/** Normaliza un teléfono mexicano a 52 + 10 dígitos. */
export function normalizeWhatsapp(input: string) {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("521") && d.length === 13) d = "52" + d.slice(3);
  if (d.length === 10) d = "52" + d;
  return d;
}

/** Deja solo los 10 dígitos del celular: quita espacios, guiones y el +52 si lo pegan. */
export function phoneDigits(input: string) {
  let d = input.replace(/\D/g, "");
  if (d.length > 10) {
    if (d.startsWith("521") && d.length >= 13) d = d.slice(3);
    else if (d.startsWith("52")) d = d.slice(2);
  }
  return d.slice(0, 10);
}

export function prettyWhatsapp(digits: string) {
  const d = digits.startsWith("52") ? digits.slice(2) : digits;
  return d.length === 10 ? d : digits;
}

export function todayKey(date = new Date()) {
  // Fecha en hora de Ciudad de México
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date);
}

/** Iniciales para el avatar de la tienda ("Antojos de Vale" → "AV"). */
export function storeInitials(name: string) {
  const words = name.split(/\s+/).filter((w) => w && !["de", "del", "la", "las", "el", "los", "y", "e"].includes(w.toLowerCase()));
  return (words.length ? words : [name]).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
