export interface PlanLimits {
  products: number;
  imagesPerProduct: number;
  categories: number;
  /** Peso máximo de la foto original antes de comprimir (MB). */
  maxOriginalMB: number;
  /** Peso máximo que acepta el servidor ya comprimida (bytes). */
  maxStoredBytes: number;
  /** Días entre cambios de link. */
  slugChangeDays: number;
  statsDays: number;
}

export type PlanId = "satelite" | "cohete" | "estacion";

/** Nombres definitivos de los planes (los mismos que guarda `subscription.planName`). */
export const PLAN_NAME: Record<PlanId, string> = { satelite: "Satélite", cohete: "Cohete", estacion: "Estación" };

/** Plan gratis (Satélite). Se puede sobreescribir en Firestore: config/plan_free. */
export const FREE_PLAN: PlanLimits = {
  products: 50,
  imagesPerProduct: 5,
  categories: 10,
  maxOriginalMB: 30,
  maxStoredBytes: 900_000,
  slugChangeDays: 30,
  statsDays: 30,
};

/** Lo que cambia respecto al plan gratis en cada plan de pago. */
export const PLAN_LIMITS: Record<PlanId, Pick<PlanLimits, "products" | "categories" | "imagesPerProduct">> = {
  satelite: { products: FREE_PLAN.products, categories: FREE_PLAN.categories, imagesPerProduct: FREE_PLAN.imagesPerProduct },
  cohete: { products: 200, categories: 25, imagesPerProduct: 8 },
  estacion: { products: 500, categories: 50, imagesPerProduct: 10 },
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function planIdFromName(name: string | undefined | null): PlanId {
  const n = norm(name ?? "");
  return n === "cohete" ? "cohete" : n === "estacion" ? "estacion" : "satelite";
}

interface PlanSource {
  subscription?: { planName: string; status: string; courtesy?: boolean } | null;
  limitOverrides?: { products?: number; categories?: number; imagesPerProduct?: number } | null;
}

/**
 * Plan vigente de una cuenta. Solo cuenta el plan de pago si la suscripción está activa, en prueba
 * o con pago pendiente (Stripe reintenta el cobro); cancelada o gratis vuelve a Satélite.
 */
export function effectivePlan(store: PlanSource): PlanId {
  const sub = store.subscription;
  if (!sub) return "satelite";
  if (sub.status === "active" || sub.status === "trial" || sub.status === "past_due") return planIdFromName(sub.planName);
  return "satelite";
}

/** Límites de una cuenta: los del plan vigente, y encima los especiales del superadmin si existen. */
export function limitsFor(base: PlanLimits, store: PlanSource): PlanLimits {
  const plan = effectivePlan(store);
  const paid = plan === "satelite" ? {} : PLAN_LIMITS[plan];
  const o = store.limitOverrides ?? {};
  return {
    ...base,
    ...paid,
    ...(o.products ? { products: o.products } : {}),
    ...(o.categories ? { categories: o.categories } : {}),
    ...(o.imagesPerProduct ? { imagesPerProduct: o.imagesPerProduct } : {}),
  };
}
