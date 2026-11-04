export type Availability = "available" | "soldout" | "onrequest";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";
export type DeliveryMethod = "punto" | "domicilio" | "tienda";

export interface ImageRef {
  path: string;
  url: string;
}

export interface Store {
  id: string; // = uid del dueño
  ownerId: string;
  ownerEmail: string | null;
  name: string;
  slug: string;
  tagline: string;
  whatsapp: string; // solo dígitos con lada de país, ej. 525512345678
  deliveryNote: string;
  paymentMethods: PaymentMethod[];
  /** Formas de entrega que el cliente puede elegir al pedir. Si falta (tiendas anteriores), se usan las de DEFAULT_DELIVERY. */
  deliveryMethods?: DeliveryMethod[];
  /** Redes sociales visibles en el catálogo (links https ya normalizados). */
  socials?: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube", string>>;
  accent: string; // color de acento del catálogo
  logo: ImageRef | null;
  isOpen: boolean;
  /** Pausa temporal pedida por el dueño (ms). Mientras no pase, el catálogo no toma pedidos. */
  pausedUntil?: number | null;
  status: "draft" | "published";
  plan: "free";
  counts: { products: number; categories: number };
  slugChangedAt: number | null;
  /** Tutorial del panel: qué pantallas ya vio la persona (se guarda en su cuenta, no en una cookie). */
  tutorial?: { enabled?: boolean; seen?: Record<string, number> };
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

/** Opciones de un producto (talla, tamaño, sabor…): nombre libre; la persona elige un valor de cada una. */
export const OPTION_SUGGESTIONS = ["Talla", "Tamaño", "Color", "Sabor", "Presentación"] as const;
export interface OptionValue {
  label: string;
  /** Precio extra en centavos (≥ 0) que suma este valor al precio base. */
  extra?: number;
  soldOut?: boolean;
}
export interface ProductOption {
  name: string;
  values: OptionValue[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | null; // centavos
  priceFrom: boolean;
  availability: Availability;
  visible: boolean;
  categoryId: string | null;
  images: ImageRef[];
  /** Opciones a elegir al pedir; cada valor puede sumar un precio extra o marcarse agotado. */
  options?: ProductOption[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface DayStats {
  id: string; // AAAA-MM-DD
  date: string;
  views?: number;
  ordersSent?: number;
  productViews?: Record<string, number>;
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified?: boolean;
}

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
