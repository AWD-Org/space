import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getStore } from "@/lib/data/queries";
import { SITE_URL } from "@/lib/env";
import { PageHeader } from "@/components/app/shell";
import { ShareKit } from "@/components/app/share-kit";
import { HelpCard } from "@/components/app/tutorial";

export const metadata: Metadata = { title: "Compartir" };

export default async function SharePage() {
  const user = await requireUser();
  const store = await getStore(user.uid);
  if (!store) return null;
  const url = `${SITE_URL}/${store.slug}`;
  return (
    <>
      <PageHeader title="Compartir" description="Entre más gente tenga tu link, más pedidos te llegan." />
      <HelpCard id="compartir" title="Llévalo a donde están tus clientes">
        Copia tu link para mandarlo por WhatsApp o ponlo en tu perfil. El código QR sirve para imprimirlo y pegarlo en tu local o en tus empaques.
      </HelpCard>
      <ShareKit url={url} displayUrl={url.replace(/^https?:\/\//, "")} storeName={store.name} accent={store.accent} published={store.status === "published"} />
    </>
  );
}
