import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStoreForView } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { PageHeader } from "@/components/app/shell";
import { StoreSettings } from "@/components/app/store-settings";
import { HelpCard } from "@/components/app/tutorial";

export const metadata: Metadata = { title: "Mi tienda" };

export default async function StorePage() {
  const user = await requireUser();
  const [store, limits] = await Promise.all([getStoreForView(user.uid), getLimits()]);
  if (!store) return null;
  return (
    <>
      <PageHeader title="Mi tienda" description="Lo que ve la gente arriba de tus productos." />
      <HelpCard id="tienda" title="Lo primero que ve la gente">
        Tu nombre, tu logo y tu color van arriba de los productos. Aquí también dices a qué WhatsApp llegan los pedidos y cómo entregas.
      </HelpCard>
      <StoreSettings store={store} host={SITE_URL.replace(/^https?:\/\//, "")} slugDays={limits.slugChangeDays} />
    </>
  );
}
