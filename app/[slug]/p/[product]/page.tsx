import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/catalog/catalog";
import { describeProduct, loadCatalog } from "../../data";

type Props = { params: Promise<{ slug: string; product: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, product } = await params;
  const result = await loadCatalog(slug);
  const p = result?.catalog.products.find((x) => x.slug === product);
  if (!result || !p) return { title: "Producto no encontrado", robots: { index: false } };
  const title = `${p.name} · ${result.catalog.store.name}`;
  const description = describeProduct(p.name, p.price, p.priceFrom, result.catalog.store.name);
  return {
    title,
    description,
    alternates: { canonical: `/${slug}/p/${product}` },
    robots: result.ownerPreview ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", url: `/${slug}/p/${product}`, title, description, siteName: "Space", locale: "es_MX" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, product } = await params;
  const result = await loadCatalog(slug);
  if (!result || !result.catalog.products.some((p) => p.slug === product)) notFound();
  const { catalog, ownerPreview } = result;
  return (
    <Catalog
      store={catalog.store}
      categories={catalog.categories}
      products={catalog.products}
      initialProductSlug={product}
      track={!ownerPreview}
      ownerPreview={ownerPreview}
    />
  );
}
