import type { Store } from "@/lib/types";

/** Pantallas con ayuda. Cada una se marca como vista por separado. */
export const TUTORIAL_IDS = ["panel", "productos", "tienda", "compartir"] as const;
export type TutorialId = (typeof TUTORIAL_IDS)[number];

/** Las tiendas creadas antes de esta fecha no ven el tutorial a menos que lo pidan en Mi cuenta. */
export const TUTORIAL_LAUNCH = Date.UTC(2026, 9, 29, 12);

export function tutorialState(store: Pick<Store, "tutorial" | "createdAt">): { enabled: boolean; seen: TutorialId[] } {
  const enabled = store.tutorial?.enabled ?? store.createdAt >= TUTORIAL_LAUNCH;
  const seen = TUTORIAL_IDS.filter((id) => Boolean(store.tutorial?.seen?.[id]));
  return { enabled, seen };
}
