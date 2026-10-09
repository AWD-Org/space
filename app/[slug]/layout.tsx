import { notFound } from "next/navigation";
import { loadCatalog } from "./data";

/**
 * La existencia de la tienda se comprueba aquí, fuera de loading.tsx, para que el
 * encabezado HTTP salga como 404 real antes de empezar a enviar la página.
 */
export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await loadCatalog(slug))) notFound();
  return children;
}
