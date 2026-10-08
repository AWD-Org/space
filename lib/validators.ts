import { z } from "zod";
import { normalizeWhatsapp } from "./format";

export const ACCENTS = [
  { value: "#3B55E6", label: "Azul Space" },
  { value: "#B4235A", label: "Frambuesa" },
  { value: "#1A7F5A", label: "Verde" },
  { value: "#B45309", label: "Caramelo" },
  { value: "#6D28D9", label: "Uva" },
  { value: "#1E1F24", label: "Tinta" },
] as const;

const accentValues = ACCENTS.map((a) => a.value) as [string, ...string[]];

export const whatsappSchema = z
  .string()
  .transform((v) => normalizeWhatsapp(v))
  .refine((v) => /^52\d{10}$/.test(v), "Escribe tu WhatsApp a 10 dígitos.");

export const storeNameSchema = z.string().trim().min(2, "Ponle un nombre de al menos 2 letras.").max(40, "Máximo 40 caracteres.");

export const createStoreSchema = z.object({
  name: storeNameSchema,
  slug: z.string().trim().toLowerCase(),
  whatsapp: whatsappSchema,
  accent: z.enum(accentValues).optional(),
});

export const updateStoreSchema = z
  .object({
    name: storeNameSchema,
    tagline: z.string().trim().max(120, "Máximo 120 caracteres."),
    whatsapp: whatsappSchema,
    deliveryNote: z.string().trim().max(160, "Máximo 160 caracteres."),
    paymentMethods: z.array(z.enum(["efectivo", "transferencia", "tarjeta"])).max(3),
    accent: z.enum(accentValues),
    isOpen: z.boolean(),
  })
  .partial();

export const imageRefSchema = z.object({ path: z.string().min(3).max(200), url: z.string().min(3).max(500) });

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "El nombre necesita al menos 2 letras.").max(60, "Máximo 60 caracteres."),
  description: z.string().trim().max(400, "Máximo 400 caracteres."),
  price: z.number().int().min(0).max(10_000_000, "Revisa el precio.").nullable(),
  priceFrom: z.boolean(),
  availability: z.enum(["available", "soldout", "onrequest"]),
  visible: z.boolean(),
  categoryId: z.string().nullable(),
  images: z.array(imageRefSchema).max(10),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categoryNameSchema = z.string().trim().min(2, "Usa al menos 2 letras.").max(30, "Máximo 30 caracteres.");

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos.";
}
