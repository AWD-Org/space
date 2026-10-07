import "server-only";
import { cache } from "react";
import { backendReady } from "@/lib/db";
import { getOwnerCatalog, getPublicCatalog, type PublicCatalog } from "@/lib/data/queries";
import { getSessionUser } from "@/lib/auth/session";
import { slugProblem } from "@/lib/slug";
import { SITE_URL } from "@/lib/env";
import { formatPrice } from "@/lib/format";

export const loadCatalog = cache(async (slug: string): Promise<{ catalog: PublicCatalog; ownerPreview: boolean } | null> => {
  if (!backendReady() || slugProblem(slug)) return null;
  const published = await getPublicCatalog(slug);
  if (published) return { catalog: published, ownerPreview: false };
  const user = await getSessionUser();
  if (!user) return null;
  const draft = await getOwnerCatalog(slug);
  if (draft && draft.store.id === user.uid) return { catalog: draft, ownerPreview: true };
  return null;
});

export function catalogJsonLd({ store, products }: PublicCatalog) {
  const url = `${SITE_URL}/${store.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Store",
        "@id": `${url}#tienda`,
        name: store.name,
        url,
        description: store.tagline || undefined,
        image: store.logo?.url,
        paymentAccepted: store.paymentMethods.length ? store.paymentMethods.join(", ") : undefined,
      },
      {
        "@type": "ItemList",
        "@id": `${url}#productos`,
        itemListElement: products.slice(0, 40).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.name,
            url: `${url}/p/${p.slug}`,
            image: p.images[0]?.url,
            description: p.description || undefined,
            offers:
              p.price != null
                ? {
                    "@type": "Offer",
                    price: (p.price / 100).toFixed(2),
                    priceCurrency: "MXN",
                    availability:
                      p.availability === "soldout" ? "https://schema.org/OutOfStock" : p.availability === "onrequest" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
                    seller: { "@id": `${url}#tienda` },
                  }
                : undefined,
          },
        })),
      },
    ],
  };
}

export function describeStore({ store, products }: PublicCatalog) {
  if (store.tagline) return `${store.tagline}. Mira el catálogo de ${store.name} y pide por WhatsApp.`;
  const names = products.slice(0, 3).map((p) => p.name).join(", ");
  return `${store.name}: ${names || "catálogo"}. Arma tu pedido y mándalo por WhatsApp.`;
}

export function describeProduct(name: string, price: number | null, priceFrom: boolean, storeName: string) {
  return `${name} · ${formatPrice(price, priceFrom)} en ${storeName}. Agrégalo a tu pedido y mándalo por WhatsApp.`;
}
