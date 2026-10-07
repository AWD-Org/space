import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, listCategories } from "@/lib/data/queries";
import { ProductForm } from "@/components/app/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ otro?: string }> }) {
  const user = await requireUser();
  const { otro } = await searchParams;
  const [categories, limits] = await Promise.all([listCategories(user.uid), getLimits()]);
  return <ProductForm key={otro ?? "nuevo"} categories={categories} maxImages={limits.imagesPerProduct} categoryLimit={limits.categories} />;
}
