import type { DeliveryMethod } from "./types";

export interface DeliveryInfo {
  label: string;
  /** Qué pide el formulario del pedido al elegirla: dirección, punto y hora, o nada. */
  detail: "address" | "when" | null;
  detailLabel: string;
  placeholder: string;
  hint: string;
}

export const DELIVERY_INFO: Record<DeliveryMethod, DeliveryInfo> = {
  punto: {
    label: "Entrega en punto de encuentro",
    detail: "when",
    detailLabel: "¿Dónde y a qué hora?",
    placeholder: "Ej. Metro Coyoacán, a las 5",
    hint: "Quedas con la persona en un lugar y hora.",
  },
  domicilio: {
    label: "Envío a domicilio",
    detail: "address",
    detailLabel: "Dirección de entrega",
    placeholder: "Calle, número, colonia y referencias",
    hint: "Llevas el pedido hasta su casa.",
  },
  tienda: {
    label: "Entrega en tienda física",
    detail: null,
    detailLabel: "",
    placeholder: "",
    hint: "La persona pasa por el pedido a tu local.",
  },
  paqueteria: {
    label: "Envío por paquetería",
    detail: "address",
    detailLabel: "Dirección de envío",
    placeholder: "Calle, número, colonia, ciudad y código postal",
    hint: "Lo mandas con una paquetería a otra ciudad.",
  },
};

export const DELIVERY_ORDER: DeliveryMethod[] = ["punto", "domicilio", "tienda", "paqueteria"];

/** Con lo que nace una tienda nueva. La paquetería se activa a propósito. */
export const DEFAULT_DELIVERY: DeliveryMethod[] = ["punto", "domicilio", "tienda"];
