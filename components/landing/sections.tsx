import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { Camera, CheckCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoProducts, stallPhoto } from "@/lib/demo";
import { FREE_PLAN } from "@/lib/plan";
import { Reveal } from "./motion";

export function SectionTitle({ title, children, id, center }: { title: string; children?: React.ReactNode; id?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 id={id} className="text-balance font-display text-[2.1rem] font-semibold leading-[1.06] text-ink sm:text-5xl">
        {title}
      </h2>
      {children && <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{children}</p>}
    </Reveal>
  );
}

function StepCard({ title, body, children, delay }: { title: string; body: string; children: React.ReactNode; delay: number }) {
  return (
    <Reveal as="li" delay={delay} className="flex flex-col">
      <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-spaceMist/70 p-6">{children}</div>
      <h3 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-muted-foreground">{body}</p>
    </Reveal>
  );
}

export async function HowItWorks() {
  const qr = await QRCode.toString("https://space.amoxtli.tech", { type: "svg", margin: 0, color: { dark: "#1E1F24", light: "#00000000" } });
  const brownie = demoProducts[1];
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="section-y">
      <div className="container">
        <SectionTitle id="como-title" title="Lo armas en una tarde, desde tu celular">
          Tu cuenta, tu primer producto y tu link quedan listos en tres pantallas. Después solo actualizas lo que cambie.
        </SectionTitle>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          <StepCard delay={0} title="Sube la foto y ponle precio" body="Desde la cámara o tu galería. Space ajusta el tamaño para que el catálogo cargue rápido.">
            <div className="flex w-full max-w-[240px] items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-spaceMist">
                <Image src={brownie.images[0].url} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate text-sm font-medium text-ink">{brownie.name}</p>
                <div className="flex h-8 items-center rounded-lg bg-cloud px-2.5 text-sm tabular-nums text-ink">
                  $35<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-blueInk" aria-hidden />
                </div>
              </div>
              <Camera className="h-5 w-5 shrink-0 text-blueInk" aria-hidden />
            </div>
          </StepCard>
          <StepCard delay={0.08} title="Comparte tu link o tu QR" body="En tu bio, en el grupo del salón o impreso en tu puesto. Siempre muestra lo que tienes hoy.">
            <div className="flex w-full max-w-[240px] flex-col items-center gap-3">
              <div className="h-24 w-24 rounded-xl bg-white p-2 shadow-sm [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden />
              <div className="flex w-full items-center justify-between gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm shadow-sm">
                <span className="truncate text-ink">space.amoxtli.tech/tu-tienda</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-spaceMist text-blueInk" aria-hidden>
                  <Copy className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </StepCard>
          <StepCard delay={0.16} title="Recibe el pedido armado" body="Con cantidades, total y lugar de entrega. Tú solo confirmas y acuerdas el pago.">
            <div className="w-full max-w-[240px] rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-[#111B21] shadow-sm">
              <p>• 2 × Galletas con chispas</p>
              <p>• 1 × Café frío</p>
              <p className="font-semibold">Total aproximado: $95</p>
              <p>Entrega: Centro, a la 1</p>
              <p className="flex items-center justify-end gap-1 text-[0.7rem] text-[#54656F]">
                1:02 p.m. <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" aria-hidden />
              </p>
            </div>
          </StepCard>
        </ol>
      </div>
    </section>
  );
}

const benefits = [
  { title: "Siempre al día", body: "Cambias un precio o marcas que algo se acabó y el link ya lo muestra. No hay archivo que volver a mandar." },
  { title: "El pedido trae el total", body: "La bolsa suma precios y arma el mensaje con cantidades, nombre de quien pide y dónde lo recoge." },
  { title: "Pausa los días que no vendes", body: "Un interruptor avisa “Hoy no está vendiendo” y apaga la bolsa. Tu catálogo sigue visible." },
  { title: "Sabes qué llama la atención", body: "Ves visitas, los productos que más abren y cuántos pedidos se mandaron cada semana." },
  { title: "Se ve bien en WhatsApp", body: "Al pegar tu link aparece una tarjeta con tu nombre y fotos de tus productos." },
];

export function Benefits() {
  return (
    <section aria-labelledby="beneficios-title" className="section-y bg-white">
      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionTitle id="beneficios-title" title="Lo que resuelve mientras tú sigues con lo tuyo" />
            <Reveal delay={0.1} className="relative mt-8 hidden aspect-[4/5] max-w-sm overflow-hidden rounded-3xl bg-spaceMist lg:block">
              <Image src={stallPhoto} alt="Pulseras y collares de chaquira acomodados en un puesto" fill sizes="384px" className="object-cover" />
            </Reveal>
          </div>
        </div>
        <ul className="divide-y divide-ink/10 border-y border-ink/10 lg:col-span-7">
          {benefits.map((b, i) => (
            <Reveal as="li" key={b.title} delay={i * 0.04} className="grid gap-2 py-7 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
              <h3 className="font-display text-xl font-semibold text-ink">{b.title}</h3>
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
    { k: "Productos", v: String(FREE_PLAN.products) },
    { k: "Fotos por producto", v: String(FREE_PLAN.imagesPerProduct) },
    { k: "Categorías", v: String(FREE_PLAN.categories) },
    { k: "Métricas", v: `${FREE_PLAN.statsDays} días` },
    { k: "Comisión por venta", v: "$0" },
  ];
  return (
    <section id="gratis" aria-labelledby="gratis-title" className="section-y">
      <div className="container">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 lg:grid-cols-2 lg:py-16">
          <Reveal>
            <h2 id="gratis-title" className="text-balance font-display text-[2.1rem] font-semibold leading-[1.06] sm:text-5xl">
              Gratis, con límites claros
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              No pide tarjeta y no se queda con parte de tus ventas. El cobro lo acuerdas tú con cada cliente, en efectivo o por transferencia.
            </p>
            <Button asChild size="lg" className="mt-8 bg-white text-ink hover:bg-spaceMist">
              <Link href="/registro">Crear mi catálogo gratis</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.1}>
            <dl className="divide-y divide-white/15 border-y border-white/15">
              {items.map((it) => (
                <div key={it.k} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="text-white/80">{it.k}</dt>
                  <dd className="font-display text-3xl font-semibold tabular-nums text-white">{it.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-white/80">Incluye tu link propio, código QR y letrero para imprimir.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
