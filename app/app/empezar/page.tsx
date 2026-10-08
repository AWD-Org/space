import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backendReady } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStore, listCategories, listProducts } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { Onboarding } from "@/components/app/onboarding";
import { NotConfigured } from "@/components/app/not-configured";

export const metadata: Metadata = { title: "Arma tu catálogo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StartPage() {
  if (!backendReady()) return <NotConfigured />;
  const user = await requireUser();
  const store = await getStore(user.uid);
  if (store?.status === "published") redirect("/app");
  const [products, categories, limits] = store ? await Promise.all([listProducts(user.uid), listCategories(user.uid), getLimits()]) : [[], [], await getLimits()];
  const step = !store ? 1 : products.length === 0 ? 2 : 3;
  return (
    <Onboarding
      initialStep={step}
      host={SITE_URL.replace(/^https?:\/\//, "")}
      store={store ? { name: store.name, slug: store.slug, whatsapp: store.whatsapp, accent: store.accent } : null}
      productCount={products.length}
      maxImages={limits.imagesPerProduct}
      categoryLimit={limits.categories}
      categories={categories}
    />
  );
}
