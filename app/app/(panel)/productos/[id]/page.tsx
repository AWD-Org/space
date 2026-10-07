import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getProduct, listCategories } from "@/lib/data/queries";
import { ProductForm } from "@/components/app/product-form";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [product, categories, limits] = await Promise.all([getProduct(user.uid, id), listCategories(user.uid), getLimits()]);
  if (!product) notFound();
  return <ProductForm key={product.id} product={product} categories={categories} maxImages={limits.imagesPerProduct} categoryLimit={limits.categories} />;
}
