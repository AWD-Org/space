"use server";

import { z } from "zod";
import { getDb, increment } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { categoriesPath, getLimits, listCategories, listProducts, productsPath, storePath } from "@/lib/data/queries";
import { MAX_IMPORT_ROWS, normKey, planImport } from "@/lib/catalog-io";
import { productOptionsSchema } from "@/lib/validators";
import { rateLimited } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import type { ActionResult, Store } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

const rowSchema = z.object({
  row: z.number().int().min(1).max(100_000),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(400),
  price: z.number().int().min(0).max(10_000_000 * 100).nullable(),
  category: z.string().trim().max(30),
  availability: z.enum(["available", "soldout", "onrequest"]),
  options: productOptionsSchema.default([]),
});

export interface ImportResult {
  created: number;
  categoriesCreated: number;
  skipped: number;
}

/** Guarda los productos de una vista previa. Vuelve a validar todo: lo que llega del navegador no es de fiar. */
export async function importProducts(input: unknown): Promise<ActionResult<ImportResult>> {
  return run(async () => {
    const user = await requireUserForAction();
    if (rateLimited(`import-save:${user.uid}`, 10, 60_000)) throw new UserError("Demasiados intentos. Espera un minuto.");
    const parsed = z.array(rowSchema).min(1).max(MAX_IMPORT_ROWS).safeParse(input);
    if (!parsed.success) throw new UserError("El archivo ya no es válido. Súbelo otra vez.");

    const limits = await getLimits();
    const db = await getDb();
    const [products, categories] = await Promise.all([listProducts(user.uid), listCategories(user.uid)]);
    const plan = planImport(parsed.data, {
      existingNames: products.map((p) => p.name),
      existingCategories: categories.map((c) => c.name),
      productSlots: limits.products - products.length,
      categorySlots: limits.categories - categories.length,
    });
    if (plan.accepted.length === 0) throw new UserError("No hay productos nuevos para importar.");

    const now = Date.now();
    const catId = new Map(categories.map((c) => [normKey(c.name), c.id]));
    const newCats = plan.newCategories.map((name, i) => ({ id: db.newId(), name, order: now + i }));
    for (const c of newCats) catId.set(normKey(c.name), c.id);

    const used = new Set(products.map((p) => p.slug));
    const slugFor = (name: string) => {
      const base = slugify(name) || "producto";
      let slug = base;
      for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
      used.add(slug);
      return slug;
    };

    let slug = "";
    await db.tx(async (tx) => {
      const store = await tx.get<Store>(storePath(user.uid));
      if (!store) throw new UserError("Primero crea tu tienda.");
      slug = store.slug;
      if ((store.counts?.products ?? 0) + plan.accepted.length > limits.products) throw new UserError(`El plan gratis permite ${limits.products} productos.`);
      if ((store.counts?.categories ?? 0) + newCats.length > limits.categories) throw new UserError(`El plan gratis permite ${limits.categories} categorías.`);
      for (const c of newCats) tx.set(`${categoriesPath(user.uid)}/${c.id}`, { name: c.name, order: c.order });
      plan.accepted.forEach((r, i) => {
        const id = db.newId();
        tx.set(`${productsPath(user.uid)}/${id}`, {
          name: r.name,
          slug: slugFor(r.name),
          description: r.description,
          price: r.price,
          priceFrom: false,
          availability: r.availability,
          visible: true,
          categoryId: r.categoryKey ? (catId.get(r.categoryKey) ?? null) : null,
          images: [],
          options: r.options.map((o) => ({
            name: o.name,
            values: o.values.map((v) => ({ label: v.label, ...(r.price != null && v.extra ? { extra: v.extra } : {}), ...(v.soldOut ? { soldOut: true } : {}) })),
          })),
          order: now + 1000 + i,
          createdAt: now,
          updatedAt: now,
        });
      });
      tx.update(storePath(user.uid), {
        "counts.products": increment(plan.accepted.length),
        "counts.categories": increment(newCats.length),
        updatedAt: now,
      });
    });
    refreshStore(slug);
    return {
      created: plan.accepted.length,
      categoriesCreated: newCats.length,
      skipped: parsed.data.length - plan.accepted.length,
    };
  });
}
