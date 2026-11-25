import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStoreForView, listCategories } from "@/lib/data/queries";
import { limitsFor } from "@/lib/plan";
import { ProductForm } from "@/components/app/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ otro?: string }> }) {
  const user = await requireUser();
  const { otro } = await searchParams;
  const [categories, base, store] = await Promise.all([listCategories(user.uid), getLimits(), getStoreForView(user.uid)]);
  const limits = limitsFor(base, store ?? {});
  return <ProductForm key={otro ?? "nuevo"} categories={categories} maxImages={limits.imagesPerProduct} categoryLimit={limits.categories} />;
}
