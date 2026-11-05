"use server";

import { getDb } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth/session";
import { getStore, productsPath, salesPath } from "@/lib/data/queries";
import { todayKey } from "@/lib/format";
import { normalizeOptions } from "@/lib/options";
import { MAX_STOCK, hasStockNumber, stockMode } from "@/lib/stock";
import type { ActionResult, Product, Sale } from "@/lib/types";
import { refreshStore, run, UserError } from "./helpers";

const MAX_SALE_QTY = 9_999;

function validQty(qty: unknown) {
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_SALE_QTY) throw new UserError("La cantidad debe ser un número entero de 1 en adelante.");
  return qty;
}

/**
 * El vendedor registra una venta: guarda el registro (para las estadísticas) y, si el producto lleva la cuenta,
 * descuenta las unidades en la misma transacción. Un producto sin stock también puede registrar ventas.
 * `value` es el valor elegido cuando el producto tiene una única opción.
 */
export async function registerSale(input: { productId: string; qty: number; value?: string }): Promise<ActionResult<{ saleId: string; left: number | null }>> {
  return run(async () => {
    const user = await requireUserForAction();
    const qty = validQty(input.qty);
    const db = await getDb();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const path = `${productsPath(user.uid)}/${input.productId}`;
    const saleId = db.newId();
    let left: number | null = null;
    await db.tx(async (tx) => {
      const product = await tx.get<Product>(path);
      if (!product) throw new UserError("Ese producto ya no existe.");
      const options = normalizeOptions(product.options);
      const p = { options, stock: hasStockNumber(product.stock) ? product.stock : null };
      const now = Date.now();
      let unit = product.price;
      let value: string | undefined;
      let tracked = false;
      let patch: Record<string, unknown> = {};

      if (stockMode(p) === "values") {
        const opt = options[0]!;
        const v = opt.values.find((x) => x.label === input.value);
        if (!v) throw new UserError(`Elige ${opt.name.toLowerCase()}.`);
        value = v.label;
        if (unit != null) unit += v.extra ?? 0;
        if (hasStockNumber(v.stock)) {
          if (qty > v.stock) throw new UserError(v.stock === 0 ? `No tienes stock de ${v.label}.` : `Solo tienes ${v.stock} de ${v.label}.`);
          tracked = true;
          left = v.stock - qty;
          patch = { options: options.map((o) => ({ ...o, values: o.values.map((x) => (x.label === v.label ? { ...x, stock: v.stock! - qty } : x)) })) };
        }
      } else if (p.stock !== null) {
        if (qty > p.stock) throw new UserError(p.stock === 0 ? "No tienes stock de este producto." : `Solo tienes ${p.stock} en stock.`);
        tracked = true;
        left = p.stock - qty;
        patch = { stock: p.stock - qty };
      }

      const sale: Omit<Sale, "id"> = { productId: product.id, productName: product.name, qty, unitPrice: unit ?? null, tracked, at: now, date: todayKey(new Date(now)), ...(value ? { value } : {}) };
      tx.set(`${salesPath(user.uid)}/${saleId}`, sale);
      if (tracked) tx.update(path, { ...patch, updatedAt: now });
    });
    refreshStore(store.slug);
    return { saleId, left };
  });
}

/** Deshace una venta: la borra y devuelve las unidades si habían descontado del stock. */
export async function undoSale(saleId: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    const db = await getDb();
    const store = await getStore(user.uid);
    await db.tx(async (tx) => {
      const salePath = `${salesPath(user.uid)}/${saleId}`;
      const sale = await tx.get<Sale>(salePath);
      if (!sale) throw new UserError("Esa venta ya no existe.");
      const path = `${productsPath(user.uid)}/${sale.productId}`;
      const product = sale.tracked ? await tx.get<Product>(path) : null;
      if (product) {
        const options = normalizeOptions(product.options);
        const p = { options, stock: hasStockNumber(product.stock) ? product.stock : null };
        if (stockMode(p) === "values" && sale.value) {
          const v = options[0]?.values.find((x) => x.label === sale.value);
          if (v && hasStockNumber(v.stock)) {
            tx.update(path, { options: options.map((o) => ({ ...o, values: o.values.map((x) => (x.label === sale.value ? { ...x, stock: Math.min(MAX_STOCK, v.stock! + sale.qty) } : x)) })), updatedAt: Date.now() });
          }
        } else if (p.stock !== null) {
          tx.update(path, { stock: Math.min(MAX_STOCK, p.stock + sale.qty), updatedAt: Date.now() });
        }
      }
      tx.delete(salePath);
    });
    refreshStore(store?.slug);
    return undefined;
  });
}

/**
 * Fija el stock (reponer o corregir). `stock: null` deja de llevar la cuenta.
 * `value` indica a qué valor aplica cuando el producto tiene una única opción.
 */
export async function setStock(input: { productId: string; stock: number | null; value?: string }): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUserForAction();
    if (input.stock !== null && (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > MAX_STOCK)) throw new UserError(`El stock es un número entero de 0 a ${MAX_STOCK.toLocaleString("es-MX")}.`);
    const db = await getDb();
    const store = await getStore(user.uid);
    if (!store) throw new UserError("Primero crea tu tienda.");
    const path = `${productsPath(user.uid)}/${input.productId}`;
    await db.tx(async (tx) => {
      const product = await tx.get<Product>(path);
      if (!product) throw new UserError("Ese producto ya no existe.");
      const options = normalizeOptions(product.options);
      if (stockMode({ options }) === "values") {
        const opt = options[0]!;
        if (!opt.values.some((v) => v.label === input.value)) throw new UserError(`Elige ${opt.name.toLowerCase()}.`);
        tx.update(path, {
          options: options.map((o) => ({
            ...o,
            values: o.values.map((v) => {
              if (v.label !== input.value) return v;
              const { stock: _old, ...rest } = v;
              return input.stock === null ? rest : { ...rest, stock: input.stock };
            }),
          })),
          updatedAt: Date.now(),
        });
      } else {
        tx.update(path, { stock: input.stock, updatedAt: Date.now() });
      }
    });
    refreshStore(store.slug);
    return undefined;
  });
}
