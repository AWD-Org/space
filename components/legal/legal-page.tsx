import Link from "next/link";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Space, inicio">
            <SpaceLogo variant="mark" size={22} />
            <span className="font-display font-semibold text-ink">Space</span>
          </Link>
          <Link href="/registro" className="text-sm font-medium text-blueInk underline-offset-4 hover:underline">
            Crear mi catálogo
          </Link>
        </div>
      </header>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink/80 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-ink/80">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="!mt-2 text-sm !text-muted-foreground">Última actualización: {updated}</p>
        {children}
        <p className="mt-10 text-sm text-muted-foreground">
          ¿Dudas? Escríbenos a{" "}
          <a href="mailto:space@amoxtli.tech" className="font-medium text-blueInk underline-offset-4 hover:underline">
            space@amoxtli.tech
          </a>
          .
        </p>
      </article>
    </main>
  );
}
