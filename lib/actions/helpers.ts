import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { BackendNotConfiguredError } from "@/lib/db";
import { catalogTag } from "@/lib/data/queries";
import type { ActionResult } from "@/lib/types";

export class UserError extends Error {}

export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof UserError || err instanceof BackendNotConfiguredError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof Error && err.message.startsWith("Tu sesión")) return { ok: false, error: err.message };
    console.error("[space action]", err);
    return { ok: false, error: "Algo salió mal. Intenta de nuevo en un momento." };
  }
}

/** Refresca el catálogo público y el panel después de un cambio. */
export function refreshStore(slug: string | null | undefined) {
  if (slug) {
    revalidateTag(catalogTag(slug));
    revalidatePath(`/${slug}`, "layout");
  }
  revalidatePath("/app", "layout");
}
