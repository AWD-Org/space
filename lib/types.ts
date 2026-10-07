export type Availability = "available" | "soldout" | "onrequest";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";

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
  accent: string; // color de acento del catálogo
  logo: ImageRef | null;
  isOpen: boolean;
  status: "draft" | "published";
  plan: "free";
  counts: { products: number; categories: number };
  slugChangedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
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
}

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
