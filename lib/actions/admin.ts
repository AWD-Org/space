"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdminForAction } from "@/lib/admin";
import { ADMIN_TAG } from "@/lib/data/admin";
import { getStore, storePath } from "@/lib/data/queries";
import { parsePriceInput } from "@/lib/format";
import { firstError, subscriptionSchema } from "@/lib/validators";
import type { ActionResult, Subscription } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

const ID = /^[A-Za-z0-9_-]{6,128}$/;

async function target(storeId: string) {
  if (!ID.test(storeId)) throw new UserError("Tienda no válida.");
  const store = await getStore(storeId);
  if (!store) throw new UserError("No encontramos esa tienda.");
  return store;
}

async function audit(by: string, storeId: string, action: string, detail: Record<string, unknown>) {
  const db = await getDb();
  await db.set(`adminLog/${db.newId()}`, { at: Date.now(), by, storeId, action, detail });
}

function done(slug: string) {
  revalidateTag(ADMIN_TAG);
  revalidatePath("/admin", "layout");
  refreshStore(slug);
}

/** Guarda la suscripción de una cuenta (se administra a mano). */
export async function setSubscription(storeId: string, input: Record<string, unknown>): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAdminForAction();
    const parsed = subscriptionSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const store = await target(storeId);
    const v = parsed.data;
    let renewsAt: number | null = null;
    if (v.renewsOn) {
      renewsAt = new Date(`${v.renewsOn}T12:00:00Z`).getTime();
      if (Number.isNaN(renewsAt)) throw new UserError("Fecha no válida.");
    }
    let amountCents: number | null = null;
    if (v.amount) {
      amountCents = parsePriceInput(v.amount);
      if (amountCents == null || amountCents < 0 || amountCents > 100_000_000) throw new UserError("Monto no válido.");
    }
    const subscription: Subscription = { planName: v.planName, status: v.status, renewsAt, amountCents, note: v.note, updatedAt: Date.now() };
    const db = await getDb();
    await db.update(storePath(storeId), { subscription });
    await audit(admin.email!, storeId, "setSubscription", { status: v.status, planName: v.planName, renewsAt });
    done(store.slug);
    return undefined;
  });
}

/** Publica o despublica una tienda, o abre y cierra sus pedidos. */
export async function setStoreState(storeId: string, input: { status?: "draft" | "published"; isOpen?: boolean }): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAdminForAction();
    const store = await target(storeId);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (input.status !== undefined) {
      if (input.status !== "draft" && input.status !== "published") throw new UserError("Estado no válido.");
      patch.status = input.status;
    }
    if (input.isOpen !== undefined) {
      if (typeof input.isOpen !== "boolean") throw new UserError("Valor no válido.");
      patch.isOpen = input.isOpen;
    }
    if (Object.keys(patch).length === 1) throw new UserError("No hay nada que cambiar.");
    const db = await getDb();
    await db.update(storePath(storeId), patch);
    await audit(admin.email!, storeId, "setStoreState", patch);
    done(store.slug);
    return undefined;
  });
}
