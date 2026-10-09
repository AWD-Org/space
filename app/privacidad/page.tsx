import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Qué datos recaba Space®, para qué los usa, con quién los comparte y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Aviso de privacidad" updated="9 de octubre de 2026">
      <p>
        Space® es un servicio de AMOXTLI® (amoxtli.tech) para crear catálogos digitales y recibir pedidos por WhatsApp. AMOXTLI® es responsable del tratamiento de los datos personales descritos aquí, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
      </p>

      <h2>Responsable</h2>
      <p>
        AMOXTLI®, con domicilio en Uhma 60-B, colonia Del Valle, alcaldía Benito Juárez, C.P. 03100, Ciudad de México. Contacto: space@amoxtli.tech.
      </p>

      <h2>Datos que recabamos</h2>
      <ul>
        <li>De quien abre una cuenta: nombre, correo electrónico y, si entra con Google, el identificador de su cuenta de Google. La contraseña la gestiona Firebase Authentication; Space no puede verla.</li>
        <li>De la tienda: nombre, link, frase, color, número de WhatsApp para pedidos, nota de entrega, formas de pago informativas, logo, productos, precios y fotos. Esta información es pública cuando la tienda se publica.</li>
        <li>Contadores sin datos personales: visitas al catálogo, vistas de producto y pedidos enviados, por día.</li>
      </ul>

      <h2>Lo que no guardamos</h2>
      <p>
        Quien compra arma su pedido en su propio navegador y lo envía directamente por WhatsApp a la tienda. Space no almacena el nombre, la dirección ni la nota que el comprador escribe. La bolsa de compras se guarda solo en el dispositivo del comprador (almacenamiento local del navegador) y puede vaciarse en cualquier momento.
      </p>

      <h2>Para qué usamos los datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y tu catálogo.</li>
        <li>Mostrar tu catálogo a quien tenga tu link.</li>
        <li>Enviarte correos de la cuenta, como confirmar tu correo y restablecer tu contraseña.</li>
        <li>Mostrarte estadísticas básicas de tu tienda y mejorar el servicio.</li>
      </ul>

      <h2>Cookies y almacenamiento local</h2>
      <p>
        Usamos una cookie técnica de sesión (necesaria para que permanezcas dentro de tu panel) y almacenamiento local para recordar la bolsa del comprador. No usamos cookies de publicidad.
      </p>

      <h2>Con quién compartimos los datos</h2>
      <p>No vendemos datos personales. Para operar el servicio usamos proveedores que los procesan por cuenta de AMOXTLI®:</p>
      <ul>
        <li>Google (Firebase Authentication y Firestore): cuentas y base de datos.</li>
        <li>Netlify: alojamiento del sitio.</li>
        <li>Resend: envío de los correos de la cuenta.</li>
      </ul>
      <p>También podemos compartir datos si una autoridad competente lo requiere conforme a la ley.</p>

      <h2>Tus derechos ARCO</h2>
      <p>
        Puedes solicitar el acceso, la rectificación o la cancelación de tus datos, y oponerte a su tratamiento, escribiendo a space@amoxtli.tech desde el correo de tu cuenta. Responderemos en un máximo de 20 días hábiles. También puedes pausar o eliminar tu cuenta y tu catálogo tú mismo desde Mi cuenta, en el panel.
      </p>

      <h2>Cambios a este aviso</h2>
      <p>Si cambiamos este aviso, publicaremos la nueva versión en esta página con su fecha de actualización.</p>
    </LegalPage>
  );
}
