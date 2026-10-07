import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, listCategories, listProducts } from "@/lib/data/queries";
import { ProductsManager } from "@/components/app/products-manager";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductsPage() {
  const user = await requireUser();
  const [products, categories, limits] = await Promise.all([listProducts(user.uid), listCategories(user.uid), getLimits()]);
  return <ProductsManager products={products} categories={categories} limit={limits.products} categoryLimit={limits.categories} />;
}
