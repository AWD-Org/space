import { SITE_URL } from "./env";

export function landingJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#amoxtli`,
        name: "AMOXTLI",
        url: "https://amoxtli.tech",
        email: "hello@amoxtli.tech",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#sitio`,
        url: SITE_URL,
        name: "Space",
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE_URL}/#amoxtli` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Space",
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Catálogo digital gratis para vender por WhatsApp: los clientes arman su pedido y lo mandan con total.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "MXN" },
        creator: { "@id": `${SITE_URL}/#amoxtli` },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#pagina`,
        url: SITE_URL,
        name: "Space · Catálogo digital gratis para vender por WhatsApp",
        isPartOf: { "@id": `${SITE_URL}/#sitio` },
        about: { "@id": `${SITE_URL}/#app` },
        inLanguage: "es-MX",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#preguntas`,
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}
