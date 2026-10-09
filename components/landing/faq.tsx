import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { SectionTitle } from "./sections";

export const FAQ = [
  {
    q: "¿De verdad es gratis?",
    a: "Sí. Crear tu catálogo, compartirlo y recibir pedidos no cuesta nada, y Space no cobra comisión por lo que vendes. El plan gratis tiene límites de productos, fotos y categorías que puedes ver arriba.",
  },
  {
    q: "¿Necesito RFC o cuenta de banco?",
    a: "No. Space no cobra a tus clientes: el pedido te llega por WhatsApp y el pago lo acuerdas tú, en efectivo, transferencia o como prefieras.",
  },
  {
    q: "¿Mis clientes tienen que descargar algo o crear cuenta?",
    a: "No. Abren tu link en el navegador del celular, eligen y te mandan el pedido desde su propio WhatsApp.",
  },
  {
    q: "¿Puedo cobrar con tarjeta en línea?",
    a: "Por ahora no. Puedes indicar que aceptas tarjeta si tienes terminal, pero el cobro pasa fuera de Space.",
  },
  {
    q: "¿Qué pasa cuando se me acaba algo?",
    a: "Lo marcas como “Se acabó” en un toque. Sigue en tu catálogo, pero ya no se puede agregar a la bolsa hasta que lo vuelvas a activar.",
  },
  {
    q: "¿Sirve si no vendo comida?",
    a: "Sí. Funciona igual para pulseras, ropa, stickers, velas, dibujos por encargo o asesorías. Si tiene foto y precio, o lo cotizas por mensaje, cabe en tu catálogo.",
  },
  {
    q: "¿Puedo cambiar el link de mi tienda?",
    a: "Sí, desde los ajustes de tu tienda. Puedes cambiarlo una vez cada 30 días; el link anterior deja de funcionar, así que conviene avisar a tus clientes.",
  },
  {
    q: "¿Por qué se llama Space?",
    a: "Porque la idea es que sea tu espacio: un lugar propio en internet donde tus productos están ordenados y desde donde tu negocio puede ir creciendo. Hoy empieza con un catálogo y un link.",
  },
  {
    q: "¿Quién hace Space?",
    a: "AMOXTLI, un estudio de diseño y desarrollo de software en la Ciudad de México.",
  },
];

export function Faq() {
  return (
    <section id="preguntas" aria-labelledby="preguntas-title" className="section-y scroll-mt-16 bg-white">
      <div className="container grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionTitle id="preguntas-title" title="Antes de empezar" />
        </div>
        <Accordion type="single" collapsible className="border-t border-ink/10 lg:col-span-8">
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q} question={f.q}>
              {f.a}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
