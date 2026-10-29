import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backendReady } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getLimits, getStore } from "@/lib/data/queries";
import { AppShell } from "@/components/app/shell";
import { NotConfigured } from "@/components/app/not-configured";
import { TutorialProvider, WelcomeTour } from "@/components/app/tutorial";
import { tutorialState } from "@/lib/tutorial";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel de Space" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!backendReady()) return <NotConfigured />;
  const user = await requireUser();
  const [store, limits] = await Promise.all([getStore(user.uid), getLimits()]);
  if (!store) redirect("/app/empezar");
  const tutorial = tutorialState(store);
  return (
    <TutorialProvider enabled={tutorial.enabled} seen={tutorial.seen}>
    <AppShell storeName={store.name} slug={store.slug} email={user.email} atLimit={store.counts.products >= limits.products} emailVerified={user.emailVerified !== false}>
      {children}
    </AppShell>
    <WelcomeTour />
    </TutorialProvider>
  );
}
