import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Las reglas para usar Space®: tu cuenta, tu catálogo, el contenido que publicas y los límites del plan gratis.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" updated="9 de octubre de 2026">
      <p>Al crear una cuenta en Space® aceptas estos términos. Space es un servicio de AMOXTLI® (amoxtli.tech).</p>

      <h2>Qué es Space</h2>
      <p>
        Una herramienta para publicar un catálogo digital con un link propio. Los clientes arman su pedido en el catálogo y lo envían por WhatsApp al vendedor. Space no procesa pagos, no cobra comisiones por venta y no interviene en la compra: el precio, el pago, la entrega y la garantía se acuerdan entre vendedor y comprador.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Debes dar datos verdaderos y mantener seguro tu acceso.</li>
        <li>Eres responsable de lo que se haga desde tu cuenta.</li>
        <li>Cada cuenta administra una tienda.</li>
      </ul>

      <h2>Tu contenido</h2>
      <p>
        Los productos, textos y fotos que publicas son tuyos. Nos autorizas a almacenarlos y mostrarlos para operar tu catálogo. Declaras que tienes derecho a usarlos y que no infringen derechos de terceros.
      </p>

      <h2>Usos no permitidos</h2>
      <ul>
        <li>Vender productos o servicios ilegales, falsificados o que pongan en riesgo a las personas.</li>
        <li>Publicar contenido engañoso, ofensivo o que viole derechos de otros.</li>
        <li>Intentar acceder a cuentas ajenas, vulnerar el servicio o inflar sus contadores.</li>
      </ul>
      <p>Podemos ocultar contenido o suspender cuentas que incumplan estas reglas.</p>

      <h2>Plan gratis y límites</h2>
      <p>
        El plan gratis incluye un número limitado de productos, fotos por producto y categorías. Los límites vigentes se muestran en tu panel y pueden cambiar con aviso previo.
      </p>

      <h2>Disponibilidad</h2>
      <p>Hacemos lo posible por mantener el servicio disponible, pero se ofrece tal cual y puede tener interrupciones. Te recomendamos conservar copia de tus fotos y datos.</p>

      <h2>Responsabilidad</h2>
      <p>
        AMOXTLI® no es parte de las ventas entre vendedores y compradores y no responde por ellas. En la medida que la ley lo permita, nuestra responsabilidad se limita al valor pagado por el servicio, que en el plan gratis es cero.
      </p>

      <h2>Cierre de cuenta</h2>
      <p>Puedes pedir que eliminemos tu cuenta y tu catálogo escribiendo a space@amoxtli.tech. El tratamiento de tus datos se describe en el Aviso de privacidad.</p>

      <h2>Cambios y ley aplicable</h2>
      <p>Podemos actualizar estos términos y publicaremos la versión vigente aquí. Se rigen por las leyes de los Estados Unidos Mexicanos.</p>
    </LegalPage>
  );
}
