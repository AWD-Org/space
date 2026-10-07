import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getStore } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { PageHeader } from "@/components/app/shell";
import { ShareKit } from "@/components/app/share-kit";

export const metadata: Metadata = { title: "Compartir" };

export default async function SharePage() {
  const user = await requireUser();
  const store = await getStore(user.uid);
  if (!store) return null;
  const url = `${SITE_URL}/${store.slug}`;
  return (
    <>
      <PageHeader title="Compartir" description="Entre más gente tenga tu link, más pedidos te llegan." />
      <ShareKit url={url} displayUrl={url.replace(/^https?:\/\//, "")} storeName={store.name} accent={store.accent} published={store.status === "published"} />
    </>
  );
}
