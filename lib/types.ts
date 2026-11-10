export type Availability = "available" | "soldout" | "onrequest";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";
export type DeliveryMethod = "punto" | "domicilio" | "tienda";

export interface ImageRef {
  path: string;
  url: string;
}

export type SubscriptionStatus = "free" | "trial" | "active" | "past_due" | "canceled";

export interface Subscription {
  planName: string;
  status: SubscriptionStatus;
  /** Próxima renovación (ms). null: sin fecha. */
  renewsAt: number | null;
  /** Monto por periodo en centavos MXN, solo informativo. */
  amountCents: number | null;
  note: string;
  updatedAt: number;
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
  /** Cómo se ajustan las fotos a la tarjeta: "cover" llena y recorta, "contain" muestra la foto completa. Sin valor: "cover". */
  imageFit?: "cover" | "contain";
  logo: ImageRef | null;
  isOpen: boolean;
  /** Pausa temporal pedida por el dueño (ms). Mientras no pase, el catálogo no toma pedidos. */
  pausedUntil?: number | null;
  status: "draft" | "published";
  plan: "free";
  /** Suscripción administrada a mano por el superadmin. Sin ella, la cuenta es gratis. */
  subscription?: Subscription;
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
  /** Unidades disponibles de este valor (solo cuando el producto tiene una única opción). Sin valor: no se lleva la cuenta. */
  stock?: number;
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
  /** Unidades disponibles del producto (sin opciones, o con 2 o 3 opciones). null o ausente: no se lleva la cuenta. */
  stock?: number | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

/** Una venta registrada por el vendedor desde el panel. */
export interface Sale {
  id: string;
  productId: string;
  productName: string;
  /** Valor elegido cuando el producto tiene una única opción. */
  value?: string;
  qty: number;
  /** Precio por pieza al momento de la venta (centavos); null si el producto no tenía precio. */
  unitPrice: number | null;
  /** ¿Descontó del stock? Sirve para devolverlo al deshacer. */
  tracked: boolean;
  at: number;
  date: string; // AAAA-MM-DD
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
