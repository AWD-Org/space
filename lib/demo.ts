import type { Availability, Product } from "./types";
import type { CatalogStore } from "@/components/catalog/catalog";

/**
 * Catálogos de ejemplo para la landing. Son demostraciones, no tiendas reales.
 * Fotos: Unsplash (licencia Unsplash). Créditos en CREDITS.md.
 */

const u = (id: string, w = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

let order = 0;
function product(id: string, name: string, price: number | null, photo: string, opts: { from?: boolean; availability?: Availability; description?: string; categoryId?: string } = {}): Product {
  order += 1;
  return {
    id,
    name,
    slug: id,
    description: opts.description ?? "",
    price: price == null ? null : price * 100,
    priceFrom: Boolean(opts.from),
    availability: opts.availability ?? "available",
    visible: true,
    categoryId: opts.categoryId ?? null,
    images: [{ path: id, url: u(photo) }],
    order,
    createdAt: 0,
    updatedAt: 0,
  };
}

export const demoStore: CatalogStore = {
  id: "demo-antojos",
  name: "Antojos de Vale",
  slug: "antojos-de-vale",
  tagline: "Postres hechos en casa",
  whatsapp: "520000000000",
  deliveryNote: "Explanada, de 12 a 3",
  paymentMethods: ["efectivo", "transferencia"],
  accent: "#B4235A",
  logo: null,
  isOpen: true,
};

export const demoProducts: Product[] = [
  product("galletas", "Galletas con chispas", 25, "photo-1583743089695-4b816a340f82", { description: "Paquete de 3." }),
  product("brownie", "Brownie de chocolate", 35, "photo-1515037893149-de7f840978e2"),
  product("fresas", "Fresas con crema", 55, "photo-1767607918214-faaeb91bd2a2"),
  product("cafe", "Café frío", 45, "photo-1578314675249-a6910f80cc4e", { from: true }),
  product("conchas", "Conchas", 18, "photo-1617859047277-9f47d2bd9696", { availability: "soldout" }),
  product("brownie-halva", "Brownie con halva", 40, "photo-1636743715220-d8f8dd900b87"),
];

export interface Showcase {
  key: string;
  tab: string;
  store: string;
  line: string;
  items: { name: string; price: string; photo: string; note?: string }[];
}

export const showcases: Showcase[] = [
  {
    key: "comida",
    tab: "Postres y comida",
    store: "Antojos de Vale",
    line: "Vende en la explanada y por encargo",
    items: [
      { name: "Galletas con chispas", price: "$25", photo: u("photo-1634188023615-7e08901193b6", 520) },
      { name: "Fresas con crema", price: "$55", photo: u("photo-1770116957825-e3b5ef516a16", 520) },
      { name: "Brownie de chocolate", price: "$35", photo: u("photo-1515037893149-de7f840978e2", 520) },
      { name: "Tamales", price: "Desde $22", photo: u("photo-1548078835-cb7d27702c1f", 520), note: "Sobre pedido" },
    ],
  },
  {
    key: "hecho-a-mano",
    tab: "Hecho a mano",
    store: "Nudo y Chaquira",
    line: "Pulseras y aretes por pieza",
    items: [
      { name: "Pulseras de chaquira", price: "$60", photo: u("photo-1766560359399-b8ac22d0e2c4", 520) },
      { name: "Aretes tejidos", price: "$90", photo: u("photo-1790159264943-1043a2edde51", 520) },
      { name: "Conejo amigurumi", price: "$180", photo: u("photo-1753370230699-8e21227afeb6", 520) },
      { name: "Bolsa de crochet", price: "$320", photo: u("photo-1746301989947-ec94ca0a23fb", 520), note: "Sobre pedido" },
    ],
  },
  {
    key: "regalos",
    tab: "Arte y regalos",
    store: "Taller Mostaza",
    line: "Stickers, velas y bolsas de tela",
    items: [
      { name: "Hoja de stickers", price: "$45", photo: u("photo-1654363529505-028513de9c2d", 520) },
      { name: "Stickers holográficos", price: "$30", photo: u("photo-1669720974831-47816c252ff1", 520) },
      { name: "Vela de soya", price: "$150", photo: u("photo-1757688525739-8d1e13daf44f", 520) },
      { name: "Bolsa de tela", price: "$120", photo: u("photo-1544816155-12df9643f363", 520) },
    ],
  },
];

export const stallPhoto = u("photo-1764426380608-8a4012e376e4", 1200);
