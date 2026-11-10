import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { backendReady } from "@/lib/db";
import { NotConfigured } from "@/components/app/not-configured";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin de Space" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  if (!backendReady()) return <NotConfigured />;
  return (
    <div className="min-h-dvh bg-cloud/40">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <span className="font-display text-lg font-semibold text-ink">Admin de Space</span>
          <nav aria-label="Admin" className="flex gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium text-ink hover:bg-cloud">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user.email}</span>
            <Link href="/app" className="inline-flex min-h-11 items-center font-medium text-blueInk hover:underline">Mi panel</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
