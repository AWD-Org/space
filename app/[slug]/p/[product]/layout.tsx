import { notFound } from "next/navigation";
import { loadCatalog } from "../../data";

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string; product: string }> }) {
  const { slug, product } = await params;
  const result = await loadCatalog(slug);
  if (!result || !result.catalog.products.some((p) => p.slug === product)) notFound();
  return children;
}
