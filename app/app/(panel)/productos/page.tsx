import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, listCategories, listProducts } from "@/lib/data/queries";
import { ProductsManager } from "@/components/app/products-manager";
import { HelpCard } from "@/components/app/tutorial";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductsPage() {
  const user = await requireUser();
  const [products, categories, limits] = await Promise.all([listProducts(user.uid), listCategories(user.uid), getLimits()]);
  return (
    <>
      <HelpCard id="productos" title="Así se manejan tus productos">
        Toca un producto para editarlo o para ocultarlo sin borrarlo. Arrastra el asa de la izquierda para cambiar su orden, y usa las categorías para agrupar tu catálogo.
      </HelpCard>
      <ProductsManager products={products} categories={categories} limit={limits.products} categoryLimit={limits.categories} />
    </>
  );
}
