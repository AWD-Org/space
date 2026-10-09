"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Home, LogOut, Package, Plus, QrCode, Store as StoreIcon } from "lucide-react";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { signOut } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/productos", label: "Productos", icon: Package },
  { href: "/app/tienda", label: "Mi tienda", icon: StoreIcon },
  { href: "/app/compartir", label: "Compartir", icon: QrCode },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-1 text-[0.72rem] font-medium", active ? "text-blueInk" : "text-muted-foreground")}>
      <Icon className="h-[22px] w-[22px]" aria-hidden />
      {label}
    </Link>
  );
}

export function AppShell({ storeName, slug, email, children }: { storeName: string; slug: string; email: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/10 bg-white px-4 py-5 lg:flex">
        <Link href="/app" className="flex items-center gap-2 px-2" aria-label="Space, inicio del panel">
          <SpaceLogo variant="mark" size={26} />
          <span className="font-display text-lg font-semibold text-ink">Space</span>
        </Link>
        <p className="mt-6 truncate px-2 text-sm font-medium text-muted-foreground">{storeName}</p>
        <nav className="mt-2 space-y-1" aria-label="Panel">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                isActive(pathname, href) ? "bg-spaceMist text-blueInk" : "text-ink hover:bg-cloud"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <a href={`/${slug}`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium text-ink hover:bg-cloud">
            <ExternalLink className="h-5 w-5" aria-hidden />
            Ver mi catálogo
          </a>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] font-medium text-ink hover:bg-cloud">
            <LogOut className="h-5 w-5" aria-hidden />
            Salir
          </button>
          {email && <p className="truncate px-3 pt-2 text-xs text-muted-foreground">{email}</p>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-white/95 px-4 backdrop-blur lg:hidden">
          <Link href="/app" className="flex min-w-0 items-center gap-2">
            <SpaceLogo variant="mark" size={22} />
            <span className="truncate font-display font-semibold text-ink">{storeName}</span>
          </Link>
          <a href={`/${slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-blueInk hover:bg-spaceMist">
            Ver catálogo
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink/10 bg-white pb-safe pt-1.5 lg:hidden" aria-label="Panel">
          {NAV.slice(0, 2).map((n) => (
            <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
          ))}
          <Link href="/app/productos/nuevo" className="flex flex-col items-center gap-0.5 text-[0.72rem] font-medium text-blueInk" aria-label="Agregar producto">
            <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-blueInk text-white shadow-[0_10px_24px_-6px_rgba(59,85,230,0.6)] ring-4 ring-white transition-transform active:scale-95">
              <Plus className="h-7 w-7" aria-hidden />
            </span>
            Agregar
          </Link>
          {NAV.slice(2).map((n) => (
            <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
          ))}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, description, children, className }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6", className)}>
      {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className={cn(title && "mt-4")}>{children}</div>
    </section>
  );
}
