import { formatPrice } from "./format";

export interface BagLine {
  name: string;
  /** Variante elegida, p. ej. «Talla M · Color Rojo». */
  variant?: string;
  qty: number;
  price: number | null; // centavos
  priceFrom?: boolean;
}

export function bagTotal(lines: BagLine[]) {
  const priced = lines.filter((l) => l.price != null);
  const total = priced.reduce((sum, l) => sum + (l.price ?? 0) * l.qty, 0);
  const partial = priced.length !== lines.length || lines.some((l) => l.priceFrom);
  return { total, partial };
}

/** Arma el mensaje de pedido que se manda por WhatsApp. */
export function buildOrderMessage(opts: {
  storeName: string;
  lines: BagLine[];
  customerName?: string;
  /** Forma de entrega ya en texto ("Envío a domicilio"). */
  delivery?: string;
  /** Dirección, o punto y hora, según la forma de entrega. */
  deliveryDetail?: string;
  deliveryDetailLabel?: string;
  payment?: string;
  note?: string;
}) {
  const { storeName, lines, customerName, delivery, deliveryDetail, deliveryDetailLabel, payment, note } = opts;
  const out: string[] = [];
  out.push(`Hola ${storeName}, quiero hacer un pedido:`);
  out.push("");
  for (const l of lines) {
    const price = l.price != null ? ` · ${formatPrice(l.price * l.qty)}` : "";
    out.push(`• ${l.qty} × ${l.name}${l.variant ? ` (${l.variant})` : ""}${price}`);
  }
  const { total, partial } = bagTotal(lines);
  if (total > 0) {
    out.push("");
    out.push(`Total${partial ? " aproximado" : ""}: ${formatPrice(total)}`);
  }
  if (customerName?.trim()) out.push(`A nombre de: ${customerName.trim()}`);
  if (delivery?.trim()) out.push(`Entrega: ${delivery.trim()}`);
  if (deliveryDetail?.trim()) out.push(`${deliveryDetailLabel?.trim() || "Detalle"}: ${deliveryDetail.trim()}`);
  if (payment?.trim()) out.push(`Forma de pago: ${payment.trim()}`);
  if (note?.trim()) out.push(`Nota: ${note.trim()}`);
  out.push("");
  out.push("(Pedido armado en Space®)");
  return out.join("\n");
}

export function whatsappLink(phoneDigits: string, message: string) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
