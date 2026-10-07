import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStore } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { PageHeader } from "@/components/app/shell";
import { StoreSettings } from "@/components/app/store-settings";

export const metadata: Metadata = { title: "Mi tienda" };

export default async function StorePage() {
  const user = await requireUser();
  const [store, limits] = await Promise.all([getStore(user.uid), getLimits()]);
  if (!store) return null;
  return (
    <>
      <PageHeader title="Mi tienda" description="Lo que ve la gente arriba de tus productos." />
      <StoreSettings store={store} host={SITE_URL.replace(/^https?:\/\//, "")} slugDays={limits.slugChangeDays} />
    </>
  );
}
