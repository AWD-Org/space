import Image from "next/image";
import QRCode from "qrcode";
import { demoProducts, stallPhoto } from "@/lib/demo";
import { FREE_PLAN } from "@/lib/plan";
import { CountUp, CtaLink, ParallaxFill, Reveal, ScaleOnScroll, WordsReveal } from "./motion";
import { OrderStep, PriceStep, ShareStep } from "./steps";

export function SectionTitle({ title, children, id, center }: { title: string; children?: React.ReactNode; id?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 id={id} className="text-balance font-display text-[2.1rem] font-semibold leading-[1.06] text-ink sm:text-5xl">
        <WordsReveal text={title} />
      </h2>
      {children && (
        <Reveal delay={0.25} y={14}>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{children}</p>
        </Reveal>
      )}
    </div>
  );
}

function StepCard({ title, body, children, delay }: { title: string; body: string; children: React.ReactNode; delay: number }) {
  return (
    <Reveal as="li" delay={delay} className="flex flex-col">
      <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-spaceMist/70 p-6 transition-[background-color,transform] duration-500 ease-out hover:-translate-y-1 hover:bg-spaceMist">{children}</div>
      <h3 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-muted-foreground">{body}</p>
    </Reveal>
  );
}

export async function HowItWorks() {
  const qr = await QRCode.toString("https://space.amoxtli.tech", { type: "svg", margin: 0, color: { dark: "#1E1F24", light: "#00000000" } });
  const brownie = demoProducts[1];
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="section-y scroll-mt-16">
      <div className="container">
        <SectionTitle id="como-title" title="De tu celular a tu espacio en tres pasos">
          Creas tu cuenta, subes tu primer producto y ya tienes una dirección que compartir. Después solo cambias lo que cambie.
        </SectionTitle>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          <StepCard delay={0} title="Sube la foto y ponle precio" body="Toma la foto o elige una de tu galería. Space la comprime en tu celular para que el catálogo abra rápido.">
            <PriceStep image={brownie.images[0].url} name={brownie.name} price="$35 MXN" />
          </StepCard>
          <StepCard delay={0.1} title="Comparte tu link o tu QR" body="Ponlo en tu bio, en un grupo o impreso en tu puesto. Siempre muestra lo que tienes hoy.">
            <ShareStep qr={qr} />
          </StepCard>
          <StepCard delay={0.2} title="Recibe el pedido armado" body="Con cantidades, total y lugar de entrega. Tú confirmas y acuerdas el pago como prefieras.">
            <OrderStep />
          </StepCard>
        </ol>
      </div>
    </section>
  );
}

const benefits = [
  { title: "Lo que ves es lo que hay", body: "Cambias un precio o marcas que algo se acabó y tu link lo muestra al momento. No queda ningún archivo viejo circulando." },
  { title: "El pedido trae las cuentas hechas", body: "La bolsa suma los precios, avisa cuando algún producto va a consultar y arma el mensaje con cantidades, nombre de quien pide y entrega." },
  { title: "Pausas cuando no vendes", body: "Un interruptor cambia tu tienda a “Hoy no está vendiendo” y apaga la bolsa. El catálogo se sigue viendo." },
  { title: "Sabes qué se mira", body: "Visitas, productos más abiertos y pedidos enviados, de los últimos 30 días, sin instalar nada más." },
  { title: "Tu link se ve bien al pegarlo", body: "En WhatsApp aparece con tu nombre y tu foto. Cada producto tiene además su propio link para mandar uno solo." },
  { title: "Un espacio que se ve como tú", body: "Subes tu logo, eliges el color que quieras y pones tu forma de entrega y los pagos que aceptas." },
];

export function Benefits() {
  return (
    <section aria-labelledby="beneficios-title" className="section-y bg-white">
      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionTitle id="beneficios-title" title="Lo que cambia en tu día a día" />
            <Reveal delay={0.1} className="relative mt-8 hidden aspect-[4/5] max-w-sm overflow-hidden rounded-3xl bg-spaceMist lg:block">
              <ParallaxFill>
                <Image src={stallPhoto} alt="Pulseras y collares de chaquira acomodados en un puesto" fill sizes="384px" className="object-cover" />
              </ParallaxFill>
            </Reveal>
          </div>
        </div>
        <ul className="divide-y divide-ink/10 border-y border-ink/10 lg:col-span-7">
          {benefits.map((b, i) => (
            <Reveal
              as="li"
              key={b.title}
              delay={i * 0.04}
              className="group relative grid gap-2 py-7 transition-[padding] duration-300 ease-out before:absolute before:inset-y-5 before:left-0 before:w-0.5 before:origin-center before:scale-y-0 before:rounded-full before:bg-blueInk before:transition-transform before:duration-300 hover:pl-5 hover:before:scale-y-100 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8"
            >
              <h3 className="font-display text-xl font-semibold text-ink transition-colors duration-300 group-hover:text-blueInk">{b.title}</h3>
              <p className="text-[1.0625rem] leading-relaxed text-muted-foreground">{b.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FreePlan() {
  const items = [
    { k: "Productos", value: FREE_PLAN.products },
    { k: "Fotos por producto", value: FREE_PLAN.imagesPerProduct },
    { k: "Categorías", value: FREE_PLAN.categories },
    { k: "Historial de métricas", value: FREE_PLAN.statsDays, suffix: " días" },
    { k: "Comisión por venta", value: 0, prefix: "$", suffix: " MXN" },
  ];
  return (
    <section id="gratis" aria-labelledby="gratis-title" className="section-y scroll-mt-16">
      <div className="container">
        <ScaleOnScroll>
          <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 lg:grid-cols-2 lg:py-16">
            <div>
              <h2 id="gratis-title" className="text-balance font-display text-[2.1rem] font-semibold leading-[1.06] sm:text-5xl">
                <WordsReveal text="Tu espacio, con lo necesario desde el primer día" />
              </h2>
              <Reveal delay={0.2} y={14}>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
                  Sin tarjeta y sin comisión por venta. El cobro lo acuerdas tú con cada cliente, en efectivo o por transferencia.
                </p>
                <div className="mt-8">
                  <CtaLink href="/registro" className="bg-white text-ink hover:bg-spaceMist">
                    Crear mi catálogo gratis
                  </CtaLink>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <dl className="divide-y divide-white/15 border-y border-white/15">
                {items.map((it) => (
                  <div key={it.k} className="flex items-baseline justify-between gap-6 py-4">
                    <dt className="text-white/80">{it.k}</dt>
                    <dd className="font-display text-3xl font-semibold text-white">
                      <CountUp value={it.value} prefix={it.prefix} suffix={it.suffix} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-white/80">Incluye tu link propio, código QR y letrero para imprimir.</p>
            </Reveal>
          </div>
        </ScaleOnScroll>
      </div>
    </section>
  );
}
