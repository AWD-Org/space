import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/catalog/catalog";
import { SITE_URL } from "@/lib/env";
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
  const item = catalog.products.find((p) => p.slug === product)!;
  const url = `${SITE_URL}/${catalog.store.slug}/p/${item.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    url,
    description: item.description || undefined,
    image: item.images.map((i) => (i.url.startsWith("/") ? `${SITE_URL}${i.url}` : i.url)),
    offers:
      item.price != null
        ? {
            "@type": "Offer",
            price: (item.price / 100).toFixed(2),
            priceCurrency: "MXN",
            availability: item.availability === "soldout" ? "https://schema.org/OutOfStock" : item.availability === "onrequest" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            url,
          }
        : undefined,
  };
  return (
    <>
      {!ownerPreview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <Catalog
      store={catalog.store}
      categories={catalog.categories}
      products={catalog.products}
      initialProductSlug={product}
      track={!ownerPreview}
      ownerPreview={ownerPreview}
    />
    </>
  );
}
