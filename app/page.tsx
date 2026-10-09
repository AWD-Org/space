import * as React from "react";
import { LandingHeader } from "@/components/landing/header";
import { HeroDemo } from "@/components/landing/hero-demo";
import { BeforeAfter } from "@/components/landing/before-after";
import { Showcase } from "@/components/landing/showcase";
import { Benefits, FreePlan, HowItWorks, SectionTitle } from "@/components/landing/sections";
import { Faq, FAQ } from "@/components/landing/faq";
import { FinalCta, LandingFooter } from "@/components/landing/footer";
import { CtaLink, Parallax, ScrollProgress, ScrollWords, SmoothScroll } from "@/components/landing/motion";
import { landingJsonLd } from "@/lib/seo";

const HERO_TITLE = "Tu catálogo digital, donde el cliente arma su pedido solo";

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd(FAQ)).replace(/</g, "\\u003c") }} />
      <SmoothScroll />
      <ScrollProgress />
      <LandingHeader />
      <main>
        <section aria-labelledby="hero-title" className="overflow-hidden pb-16 pt-8 sm:pt-12 lg:pb-24">
          <div className="container grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h1 id="hero-title" className="text-balance font-display text-[2.6rem] font-semibold leading-[1.02] text-ink sm:text-6xl lg:text-[3.4rem] xl:text-[3.75rem]">
                {HERO_TITLE.split(" ").map((w, i) => (
                  <React.Fragment key={i}>
                    <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                      <span className="inline-block animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
                        {w}
                      </span>
                    </span>{" "}
                  </React.Fragment>
                ))}
              </h1>
              <p className="mt-6 max-w-lg animate-fade-up text-pretty text-lg leading-relaxed text-muted-foreground [animation-delay:350ms] sm:text-xl">
                Space® es tu espacio para vender desde el celular. Subes tus productos, compartes un link y el pedido te llega a WhatsApp con cantidades, total y lugar de entrega.
              </p>
              <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-5 gap-y-3 [animation-delay:450ms]">
                <CtaLink href="/registro">Crear mi catálogo gratis</CtaLink>
                <p className="text-sm text-muted-foreground">Sin tarjeta. Sin comisiones.</p>
              </div>
            </div>
            <div className="animate-fade-up [animation-delay:250ms] lg:col-span-7">
              <Parallax distance={22}>
                <HeroDemo />
              </Parallax>
            </div>
          </div>
        </section>

        <section className="section-y">
          <div className="container">
            <ScrollWords
              className="max-w-4xl text-balance font-display text-[1.9rem] font-semibold leading-[1.12] sm:text-5xl"
              text="Tus clientes ya te escriben por WhatsApp. Space® no cambia eso: te da un espacio propio donde lo primero que te llega es el pedido completo."
            />
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
            <SectionTitle id="para-title" title="Se adapta a lo que vendes">
              Postres, accesorios, arte. Cada producto lleva hasta 4 fotos, precio, descripción y su estado: disponible, se acabó o sobre pedido.
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
