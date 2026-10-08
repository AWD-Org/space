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

/** Plan gratis de Space. Se puede sobreescribir en Firestore: config/plan_free. */
export const FREE_PLAN: PlanLimits = {
  products: 40,
  imagesPerProduct: 4,
  categories: 6,
  maxOriginalMB: 8,
  maxStoredBytes: 900_000,
  slugChangeDays: 30,
  statsDays: 30,
};
