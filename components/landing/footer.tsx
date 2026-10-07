import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { Reveal } from "./motion";

export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="section-y">
      <Reveal className="container text-center">
        <h2 id="final-title" className="mx-auto max-w-3xl text-balance font-display text-[2.4rem] font-semibold leading-[1.04] text-ink sm:text-6xl">
          Que tu próximo pedido llegue ya armado
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Abre tu cuenta, sube tu primer producto y comparte el link hoy mismo.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="h-14 px-8 text-[1.05rem]">
            <Link href="/registro">Crear mi catálogo gratis</Link>
          </Button>
          <p className="text-sm text-muted-foreground">Entras con Google o con tu correo.</p>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SpaceLogo variant="mark" size={24} />
          <span className="font-display font-semibold text-ink">Space</span>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Pie de página">
          <Link href="/registro" className="text-ink/80 hover:text-ink">
            Crear catálogo
          </Link>
          <Link href="/entrar" className="text-ink/80 hover:text-ink">
            Entrar
          </Link>
          <a href="#preguntas" className="text-ink/80 hover:text-ink">
            Preguntas
          </a>
        </nav>
        <p className="text-sm text-muted-foreground">
          Desarrollado por{" "}
          <a href="https://amoxtli.tech" target="_blank" rel="noopener" className="font-medium text-ink hover:underline">
            AMOXTLI®
          </a>
        </p>
      </div>
      <p className="container pb-8 text-xs text-muted-foreground">Las tiendas y fotos de esta página son ejemplos. Fotos de Unsplash.</p>
    </footer>
  );
}
