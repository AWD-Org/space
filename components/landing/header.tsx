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
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
            <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[0.95rem] text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink">
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
