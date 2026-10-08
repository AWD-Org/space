"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#gratis", label: "Qué incluye" },
  { href: "#preguntas", label: "Preguntas" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState<string>("");
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id));
        setActive(ids.find((id) => seen.has(id)) ?? "");
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 transition-colors", scrolled ? "border-b border-ink/5 bg-background/90 backdrop-blur" : "bg-transparent")}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Space, inicio">
          <SpaceLogo variant="mark" size={28} />
          <span className="font-display text-xl font-semibold text-ink">Space</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={active === l.href.slice(1) ? "location" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[0.95rem] transition-colors hover:bg-ink/5 hover:text-ink",
                active === l.href.slice(1) ? "bg-white text-ink shadow-sm ring-1 ring-ink/5" : "text-ink/80"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registro">Crear catálogo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
