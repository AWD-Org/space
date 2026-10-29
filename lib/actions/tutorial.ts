"use server";

import { getDb } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { getStore, storePath } from "@/lib/data/queries";
import { TUTORIAL_IDS, type TutorialId } from "@/lib/tutorial";
import type { ActionResult } from "@/lib/types";
import { run, UserError } from "./helpers";

/** Marca una pantalla del tutorial como vista, en la cuenta de la persona. */
export async function markTutorialSeen(id: TutorialId): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    if (!TUTORIAL_IDS.includes(id)) throw new UserError("Pantalla no válida.");
    if (!(await getStore(user.uid))) return undefined;
    const db = await getDb();
    await db.update(storePath(user.uid), { [`tutorial.seen.${id}`]: Date.now() });
    return undefined;
  });
}

/** «Ver el tutorial otra vez»: borra lo visto y lo activa aunque la cuenta sea anterior al tutorial. */
export async function restartTutorial(): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    if (!(await getStore(user.uid))) throw new UserError("Primero crea tu tienda.");
    const db = await getDb();
    await db.update(storePath(user.uid), { tutorial: { enabled: true, seen: {} } });
    return undefined;
  });
}
