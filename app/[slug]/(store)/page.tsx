import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/catalog/catalog";
import { catalogJsonLd, describeStore, loadCatalog } from "../data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCatalog(slug);
  if (!result) return { title: "Catálogo no encontrado", robots: { index: false } };
  const { catalog, ownerPreview } = result;
  const description = describeStore(catalog);
  return {
    title: catalog.store.name,
    description,
    alternates: { canonical: `/${slug}` },
    robots: ownerPreview ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", url: `/${slug}`, title: catalog.store.name, description, siteName: "Space", locale: "es_MX" },
    twitter: { card: "summary_large_image", title: catalog.store.name, description },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const result = await loadCatalog(slug);
  if (!result) notFound();
  const { catalog, ownerPreview } = result;
  return (
    <>
      {!ownerPreview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd(catalog)).replace(/</g, "\\u003c") }} />
      )}
      <Catalog store={catalog.store} categories={catalog.categories} products={catalog.products} track={!ownerPreview} ownerPreview={ownerPreview} />
    </>
  );
}
