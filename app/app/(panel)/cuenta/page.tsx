import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getStore } from "@/lib/data/queries";
import { PageHeader } from "@/components/app/shell";
import { AccountPanel } from "@/components/app/account-panel";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  const store = await getStore(user.uid);
  return (
    <>
      <PageHeader title="Mi cuenta" description="Tu correo, tu nombre y tu contraseña." />
      <AccountPanel name={user.name} email={user.email} emailVerified={user.emailVerified !== false} pausedUntil={store?.pausedUntil ?? null} />
    </>
  );
}
