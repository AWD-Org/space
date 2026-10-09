import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backendReady } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStore } from "@/lib/data/queries";
import { AppShell } from "@/components/app/shell";
import { NotConfigured } from "@/components/app/not-configured";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel de Space" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!backendReady()) return <NotConfigured />;
  const user = await requireUser();
  const store = await getStore(user.uid);
  if (!store) redirect("/app/empezar");
  return (
    <AppShell storeName={store.name} slug={store.slug} email={user.email} atLimit={store.counts.products >= (await getLimits()).products}>
      {children}
    </AppShell>
  );
}
