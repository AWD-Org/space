import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/header";
import { HeroDemo } from "@/components/landing/hero-demo";
import { BeforeAfter } from "@/components/landing/before-after";
import { Showcase } from "@/components/landing/showcase";
import { Benefits, FreePlan, HowItWorks, SectionTitle } from "@/components/landing/sections";
import { Faq, FAQ } from "@/components/landing/faq";
import { FinalCta, LandingFooter } from "@/components/landing/footer";
import { landingJsonLd } from "@/lib/seo";

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd(FAQ)).replace(/</g, "\\u003c") }} />
      <LandingHeader />
      <main>
        <section aria-labelledby="hero-title" className="overflow-hidden pb-16 pt-8 sm:pt-12 lg:pb-24">
          <div className="container grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h1 id="hero-title" className="text-balance font-display text-[2.6rem] font-semibold leading-[1.02] text-ink sm:text-6xl lg:text-[3.4rem] xl:text-[3.75rem]">
                Tu catálogo digital, con pedidos que llegan armados a tu WhatsApp
              </h1>
              <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Sube tus productos desde el celular y comparte un solo link. Tus clientes eligen, ven el total y te mandan el pedido completo.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button asChild size="lg" className="h-14 px-7 text-[1.05rem]">
                  <Link href="/registro">Crear mi catálogo gratis</Link>
                </Button>
                <p className="text-sm text-muted-foreground">Gratis. Sin tarjeta.</p>
              </div>
              <p className="mt-10 max-w-md border-l-2 border-spaceLavender pl-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                Para quien vende comida, accesorios, arte o servicios desde su celular, en un puesto o desde casa.
              </p>
            </div>
            <div className="lg:col-span-7">
              <HeroDemo />
            </div>
          </div>
        </section>

        <section aria-labelledby="mensajes-title" className="section-y bg-spaceMist/60">
          <div className="container grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionTitle id="mensajes-title" title="Deja de reenviar fotos cada vez que alguien pregunta qué hay">
                Un PDF se queda viejo en cuanto algo se acaba, y los mensajes sueltos se pierden en el chat. Con un link, la pregunta se contesta sola.
              </SectionTitle>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <BeforeAfter />
            </div>
          </div>
        </section>

        <section aria-labelledby="para-title" className="section-y">
          <div className="container">
            <SectionTitle id="para-title" title="Para vender en un puesto, en un bazar o desde tu casa">
              Cada producto lleva hasta 4 fotos, precio, descripción y si hay, se acabó o es sobre pedido.
            </SectionTitle>
            <div className="mt-10">
              <Showcase />
            </div>
          </div>
        </section>

        <HowItWorks />
        <Benefits />
        <FreePlan />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
