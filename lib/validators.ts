import { z } from "zod";
import { normalizeWhatsapp, parsePriceInput } from "./format";
import { ensureReadable, normalizeHex } from "./color";
import { slugProblem } from "./slug";
import { DELIVERY_INFO } from "./delivery";

export const ACCENTS = [
  { value: "#3B55E6", label: "Azul Space" },
  { value: "#B4235A", label: "Frambuesa" },
  { value: "#1A7F5A", label: "Verde" },
  { value: "#B45309", label: "Caramelo" },
  { value: "#6D28D9", label: "Uva" },
  { value: "#1E1F24", label: "Tinta" },
] as const;

export const accentSchema = z
  .string()
  .refine((v) => normalizeHex(v) !== null, "Ese color no es válido.")
  .transform((v) => ensureReadable(v).hex);

export const whatsappSchema = z
  .string()
  .transform((v) => normalizeWhatsapp(v))
  .refine((v) => /^52\d{10}$/.test(v), "Escribe tu WhatsApp a 10 dígitos.");

export const storeNameSchema = z.string().trim().min(2, "Ponle un nombre de al menos 2 letras.").max(40, "Máximo 40 caracteres.");

export const createStoreSchema = z.object({
  name: storeNameSchema,
  slug: z.string().trim().toLowerCase(),
  whatsapp: whatsappSchema,
  accent: accentSchema.optional(),
});

export const updateStoreSchema = z
  .object({
    name: storeNameSchema,
    tagline: z.string().trim().max(120, "Máximo 120 caracteres."),
    whatsapp: whatsappSchema,
    deliveryNote: z.string().trim().max(160, "Máximo 160 caracteres."),
    paymentMethods: z.array(z.enum(["efectivo", "transferencia", "tarjeta"])).max(3),
    deliveryMethods: z.array(z.enum(["punto", "domicilio", "tienda", "paqueteria"])).max(4),
    accent: accentSchema,
    isOpen: z.boolean(),
  })
  .partial();

export const imageRefSchema = z.object({ path: z.string().min(3).max(200), url: z.string().min(3).max(500) });

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "El nombre necesita al menos 2 letras.").max(60, "Máximo 60 caracteres."),
  description: z.string().trim().max(400, "Máximo 400 caracteres."),
  price: z.number().int().min(0).max(10_000_000 * 100, "Revisa el precio.").nullable(),
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


// ── Esquemas de formularios (cliente). Mismos mensajes que ve la persona. ──

export const phoneFieldSchema = z
  .string()
  .min(1, "Escribe tu WhatsApp.")
  .regex(/^\d{10}$/, "Debe tener 10 dígitos, sin espacios ni lada.");

export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu correo.")
  .pipe(z.email("Revisa tu correo: parece que le falta algo."));

export function authFormSchema(signup: boolean, relaxedPassword: boolean) {
  return z.object({
    name: signup ? z.string().trim().min(2, "Dinos cómo te llamas.").max(60, "Máximo 60 caracteres.") : z.string(),
    email: emailFieldSchema,
    password: signup && !relaxedPassword
      ? z.string().min(8, "Usa al menos 8 caracteres.")
      : relaxedPassword
        ? z.string()
        : z.string().min(1, "Escribe tu contraseña."),
  });
}
export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>;

export const onboardingFormSchema = z.object({
  name: storeNameSchema,
  slug: z
    .string()
    .trim()
    .min(1, "Elige tu link.")
    .superRefine((v, ctx) => {
      const problem = slugProblem(v);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
  whatsapp: phoneFieldSchema,
  accent: z.string().refine((v) => normalizeHex(v) !== null, "Ese color no es válido."),
});
export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const settingsFormSchema = z.object({
  name: z.string().trim().min(2, "Ponle un nombre de al menos 2 letras.").max(40, "Máximo 40 caracteres."),
  tagline: z.string().trim().max(120, "Máximo 120 caracteres."),
  whatsapp: phoneFieldSchema,
  deliveryNote: z.string().trim().max(160, "Máximo 160 caracteres."),
  paymentMethods: z.array(z.enum(["efectivo", "transferencia", "tarjeta"])),
  deliveryMethods: z.array(z.enum(["punto", "domicilio", "tienda", "paqueteria"])),
  accent: z.string().refine((v) => normalizeHex(v) !== null, "Ese color no es válido."),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Ponle nombre a tu producto.").min(2, "El nombre necesita al menos 2 letras.").max(60, "Máximo 60 caracteres."),
  price: z.string().refine((v) => !v.trim() || parsePriceInput(v) !== null, "Revisa el precio: solo números, por ejemplo 45 o 1,250.50.")
    .refine((v) => !v.trim() || (parsePriceInput(v) ?? 0) <= 10_000_000 * 100, "Revisa el precio."),
  priceFrom: z.boolean(),
  description: z.string().trim().max(400, "Máximo 400 caracteres."),
  categoryId: z.string().nullable(),
  availability: z.enum(["available", "soldout", "onrequest"]),
  visible: z.boolean(),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({ name: z.string().trim().min(1, "Escribe el nombre.").pipe(categoryNameSchema) });
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export interface OrderFormOptions {
  /** Hay formas de entrega para elegir. */
  delivery: boolean;
  payment: boolean;
}

/** Los datos del pedido que llena la persona que compra. Qué se pide depende de cómo configuró su tienda el dueño. */
export function makeOrderSchema(opts: OrderFormOptions) {
  return z
    .object({
      name: z.string().trim().min(2, "Escribe tu nombre para que sepan de quién es.").max(40, "Máximo 40 caracteres."),
      delivery: z.string(),
      detail: z.string().trim().max(160, "Máximo 160 caracteres."),
      payment: z.string(),
      note: z.string().trim().max(300, "Máximo 300 caracteres."),
    })
    .superRefine((v, ctx) => {
      if (opts.delivery) {
        const method = v.delivery as keyof typeof DELIVERY_INFO;
        if (!DELIVERY_INFO[method]) {
          ctx.addIssue({ code: "custom", path: ["delivery"], message: "Elige cómo quieres recibirlo." });
        } else if (DELIVERY_INFO[method].detail && v.detail.length < 3) {
          ctx.addIssue({
            code: "custom",
            path: ["detail"],
            message: DELIVERY_INFO[method].detail === "address" ? "Escribe la dirección completa." : "Dinos dónde y a qué hora.",
          });
        }
      }
      if (opts.payment && !v.payment) ctx.addIssue({ code: "custom", path: ["payment"], message: "Elige cómo vas a pagar." });
    });
}
export type OrderFormValues = z.infer<ReturnType<typeof makeOrderSchema>>;
