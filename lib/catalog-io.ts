import { centsToInput } from "./format";
import type { Availability, ProductOption } from "./types";
import { firstError, productOptionsSchema } from "./validators";

/** Importar y exportar el catálogo en CSV o Excel. Todo aquí es puro (sin base de datos) para poder probarlo solo. */

export const IMPORT_HEADERS = ["Nombre", "Descripción", "Precio", "Categoría", "Disponibilidad", "Opciones"] as const;
export const MAX_OPTIONS_CELL = 1500;
export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_BYTES = 1_000_000;
/** Un .xlsx es un zip: se revisa cuánto pesaría descomprimido antes de abrirlo, para que un archivo pequeño no llene la memoria. */
export const MAX_XLSX_UNZIPPED_BYTES = 20_000_000;

/** Suma el tamaño descomprimido declarado en el directorio central del zip. null si no parece un zip válido. */
export function zipUncompressedSize(buf: Uint8Array): number | null {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  let total = 0;
  for (let n = 0; n < entries; n++) {
    if (offset + 46 > buf.length || view.getUint32(offset, true) !== 0x02014b50) return null;
    total += view.getUint32(offset + 24, true);
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return total;
}

export interface ParsedRow {
  /** Número de fila en el archivo (la 1 es el encabezado). */
  row: number;
  name: string;
  description: string;
  /** Centavos, o null si no trae precio. */
  price: number | null;
  category: string;
  availability: Availability;
  /** Opciones del producto (talla, tamaño, sabor…); vacío si no trae. */
  options: ProductOption[];
}

export interface RowIssue {
  row: number;
  message: string;
}

export const normKey = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");

// ── Lectura ──────────────────────────────────────────────────────────────

/** UTF-8 si es válido; si no, Windows-1252 (como guarda el CSV de Excel en México). */
export function decodeText(buf: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

function detectDelimiter(firstLine: string) {
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const options: [string, number][] = [
    [",", count(",")],
    [";", count(";")],
    ["\t", count("\t")],
  ];
  options.sort((a, b) => b[1] - a[1]);
  return options[0]![1] > 0 ? options[0]![0] : ",";
}

/** CSV con comillas ("a, b", "dijo ""hola"""), saltos de línea dentro de comillas, separador , ; o tab. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** "45", "$1,250.50", "1.250,50", "45 MXN" → centavos. null si no es un precio. */
export function parseImportPrice(raw: unknown): number | null | "invalid" {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? Math.round(raw * 100) : "invalid";
  let s = String(raw).trim().replace(/mxn|pesos?|\$|\s/gi, "");
  if (!s) return null;
  if (!/^[\d.,]+$/.test(s)) return "invalid";
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // El último separador es el decimal; el otro, de miles.
    const dec = Math.max(lastDot, lastComma);
    s = s.slice(0, dec).replace(/[.,]/g, "") + "." + s.slice(dec + 1);
  } else if (lastComma >= 0) {
    const parts = s.split(",");
    s = parts.length === 2 && parts[1]!.length <= 2 ? `${parts[0]}.${parts[1]}` : parts.join("");
  } else if (s.split(".").length > 2 || /^\d{1,3}\.\d{3}$/.test(s)) {
    // "1.200" o "1.250.000": un precio no tiene 3 decimales, así que el punto es de miles.
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : "invalid";
}

function parseAvailability(raw: string): Availability | null {
  const k = normKey(raw);
  if (!k || ["disponible", "si", "sí", "en existencia", "hay"].includes(k)) return "available";
  if (["agotado", "se acabo", "sin existencia", "no disponible", "no hay"].includes(k)) return "soldout";
  if (["sobre pedido", "bajo pedido", "por encargo", "encargo", "pedido"].includes(k)) return "onrequest";
  return null;
}

const HEADER_ALIASES: Record<(typeof IMPORT_HEADERS)[number], string[]> = {
  Nombre: ["nombre", "producto", "servicio", "nombre del producto", "titulo", "name"],
  Descripción: ["descripcion", "detalle", "description"],
  Precio: ["precio", "costo", "price", "precio mxn"],
  Categoría: ["categoria", "categorias", "category", "tipo"],
  Disponibilidad: ["disponibilidad", "estado", "existencia", "availability"],
  Opciones: ["opciones", "variantes", "opciones del producto", "options", "variants"],
};

export interface TableResult {
  rows: ParsedRow[];
  issues: RowIssue[];
  /** Error que impide leer el archivo completo. */
  fatal?: string;
}


// ── Opciones (tallas, tamaños, sabores…) ─────────────────────────────────

/**
 * Formato de la celda «Opciones»: grupos separados por «;» (o salto de línea) y valores por «|».
 * Cada valor puede llevar «+precio» y «(agotado)». Ejemplo: Tamaño: Ch | Md +15 | Gd +30; Leche: Entera | Avena +10 | Soya (agotado)
 */
export function parseOptionsCell(raw: string): { options: ProductOption[] } | { error: string } {
  const text = raw.trim();
  if (!text) return { options: [] };
  if (text.length > MAX_OPTIONS_CELL) return { error: "las opciones son demasiado largas" };
  const options: ProductOption[] = [];
  for (const chunk of text.split(/\r?\n|;/)) {
    const part = chunk.trim();
    if (!part) continue;
    const colon = part.indexOf(":");
    if (colon <= 0) return { error: `las opciones deben ir como «Nombre: valor | valor» (revisa «${part.slice(0, 24)}»)` };
    const name = part.slice(0, colon).trim();
    const body = part.slice(colon + 1);
    const tokens = (body.includes("|") ? body.split("|") : body.split(",")).map((t) => t.trim()).filter(Boolean);
    const values: ProductOption["values"] = [];
    for (const token of tokens) {
      const m = /^(.*?)(?:\s*\+\s*\$?\s*([\d.,]+))?(?:\s*\(\s*agotad[oa]\s*\))?\s*$/i.exec(token);
      const label = (m?.[1] ?? token).trim();
      // «Rojo +abc»: el «+» con espacio antes indica precio extra; si no es un número, se avisa en vez de guardarlo como parte del nombre.
      if (!m?.[2] && /\s\+/.test(token)) return { error: `el precio extra de «${token.split(/\s\+/)[0]!.trim()}» no es válido` };
      let extra: number | undefined;
      if (m?.[2]) {
        const cents = parseImportPrice(m[2]);
        if (cents === "invalid" || cents === null) return { error: `el precio extra de «${label}» no es válido` };
        if (cents > 0) extra = cents;
      }
      const soldOut = /\(\s*agotad[oa]\s*\)\s*$/i.test(token);
      values.push({ label, ...(extra ? { extra } : {}), ...(soldOut ? { soldOut: true } : {}) });
    }
    options.push({ name, values });
  }
  const checked = productOptionsSchema.safeParse(options);
  if (!checked.success) return { error: firstError(checked.error).replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase()) };
  return { options: checked.data.map((o) => ({ name: o.name, values: o.values.map((v) => ({ label: v.label, ...(v.extra ? { extra: v.extra } : {}), ...(v.soldOut ? { soldOut: true } : {}) })) })) };
}

/** Inverso de parseOptionsCell, para exportar y para la plantilla. */
export function formatOptionsCell(options: ProductOption[] | undefined): string {
  return (options ?? [])
    .map((o) => {
      const vals = o.values.map((v) => `${v.label.replace(/[;|]/g, "/")}${v.extra ? ` +${centsToInput(v.extra)}` : ""}${v.soldOut ? " (agotado)" : ""}`);
      return `${o.name.replace(/[;|:]/g, "-")}: ${vals.join(" | ")}`;
    })
    .join("; ");
}

const cellText = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());
// Quita el apóstrofo que ponemos al exportar para que Excel no ejecute "=..." como fórmula.
const unescapeFormula = (v: string) => (/^'[=+\-@]/.test(v) ? v.slice(1) : v);

/** Convierte las filas crudas de un CSV o Excel en productos validados fila por fila. */
export function parseTable(table: unknown[][]): TableResult {
  const filled = table.map((r, i) => ({ r, i })).filter(({ r }) => r.some((c) => cellText(c) !== ""));
  if (filled.length === 0) return { rows: [], issues: [], fatal: "El archivo está vacío. Descarga la plantilla y llénala." };
  const head = filled[0]!;
  const col: Partial<Record<(typeof IMPORT_HEADERS)[number], number>> = {};
  head.r.forEach((c, idx) => {
    const k = normKey(cellText(c));
    for (const h of IMPORT_HEADERS) if (col[h] === undefined && HEADER_ALIASES[h].includes(k)) col[h] = idx;
  });
  if (col.Nombre === undefined) {
    return { rows: [], issues: [], fatal: "No encontramos la columna “Nombre” en la primera fila. Descarga la plantilla para ver cómo va." };
  }
  const data = filled.slice(1);
  if (data.length > MAX_IMPORT_ROWS) {
    return { rows: [], issues: [], fatal: `El archivo trae más de ${MAX_IMPORT_ROWS} filas. Divídelo en partes más pequeñas.` };
  }
  const rows: ParsedRow[] = [];
  const issues: RowIssue[] = [];
  for (const { r, i } of data) {
    const row = i + 1;
    const get = (h: (typeof IMPORT_HEADERS)[number]) => (col[h] === undefined ? "" : unescapeFormula(cellText(r[col[h]!])));
    const name = get("Nombre");
    const description = get("Descripción");
    const category = get("Categoría");
    const priceRaw = col.Precio === undefined ? null : r[col.Precio];
    const problems: string[] = [];
    // Más celdas llenas que encabezados: casi siempre es un texto con coma o «;» sin comillas que movió las columnas.
    if (r.slice(head.r.length).some((c) => cellText(c) !== "")) problems.push("tiene más columnas que el encabezado (si un texto lleva comas o «;», ponlo entre comillas)");
    if (name.length < 2) problems.push("el nombre necesita al menos 2 letras");
    if (name.length > 60) problems.push("el nombre pasa de 60 caracteres");
    if (description.length > 400) problems.push("la descripción pasa de 400 caracteres");
    if (category && category.length < 2) problems.push("la categoría necesita al menos 2 letras");
    if (category.length > 30) problems.push("la categoría pasa de 30 caracteres");
    const price = parseImportPrice(priceRaw);
    if (price === "invalid") problems.push("el precio no es válido (usa solo números, por ejemplo 45 o 1,250.50)");
    else if (price != null && price > 10_000_000 * 100) problems.push("revisa el precio");
    const availability = parseAvailability(get("Disponibilidad"));
    if (!availability) problems.push("la disponibilidad debe ser Disponible, Agotado o Sobre pedido");
    let options: ProductOption[] = [];
    const optText = get("Opciones");
    if (optText) {
      const o = parseOptionsCell(optText);
      if ("error" in o) problems.push(o.error);
      else {
        options = o.options;
        if (price == null && options.some((x) => x.values.some((v) => v.extra))) problems.push("no puedes poner precio extra si el producto no tiene precio");
      }
    }
    if (problems.length) {
      issues.push({ row, message: `Fila ${row}: ${problems.join("; ")}.` });
      continue;
    }
    rows.push({ row, name, description, price: price as number | null, category, availability: availability!, options });
  }
  return { rows, issues };
}

// ── Plan de importación ──────────────────────────────────────────────────

export interface ImportContext {
  existingNames: string[];
  existingCategories: string[];
  productSlots: number;
  categorySlots: number;
}

export interface ImportPlan {
  accepted: (ParsedRow & { categoryKey: string | null })[];
  /** Categorías nuevas que se crearán, en orden de aparición. */
  newCategories: string[];
  alreadyExist: { row: number; name: string }[];
  repeatedInFile: { row: number; name: string }[];
  overLimit: number;
  withoutCategoryByLimit: number;
}

/** Decide qué entra y qué no, con las reglas del plan. Es la misma lógica para la vista previa y para guardar. */
export function planImport(rows: ParsedRow[], ctx: ImportContext): ImportPlan {
  const seen = new Set(ctx.existingNames.map(normKey));
  const alreadyExist: ImportPlan["alreadyExist"] = [];
  const repeatedInFile: ImportPlan["repeatedInFile"] = [];
  const fresh: ParsedRow[] = [];
  const inFile = new Set<string>();
  for (const r of rows) {
    const k = normKey(r.name);
    if (seen.has(k)) alreadyExist.push({ row: r.row, name: r.name });
    else if (inFile.has(k)) repeatedInFile.push({ row: r.row, name: r.name });
    else {
      inFile.add(k);
      fresh.push(r);
    }
  }
  const slots = Math.max(0, ctx.productSlots);
  const taken = fresh.slice(0, slots);
  const overLimit = fresh.length - taken.length;

  const known = new Map(ctx.existingCategories.map((c) => [normKey(c), c]));
  const created = new Map<string, string>();
  let withoutCategoryByLimit = 0;
  const accepted = taken.map((r) => {
    if (!r.category) return { ...r, categoryKey: null };
    const k = normKey(r.category);
    if (known.has(k) || created.has(k)) return { ...r, categoryKey: k };
    if (created.size < Math.max(0, ctx.categorySlots)) {
      created.set(k, r.category.replace(/\s+/g, " "));
      return { ...r, categoryKey: k };
    }
    withoutCategoryByLimit++;
    return { ...r, categoryKey: null };
  });
  return { accepted, newCategories: [...created.values()], alreadyExist, repeatedInFile, overLimit, withoutCategoryByLimit };
}

// ── Exportar ─────────────────────────────────────────────────────────────

const AVAILABILITY_TEXT: Record<Availability, string> = { available: "Disponible", soldout: "Agotado", onrequest: "Sobre pedido" };

export interface ExportItem {
  name: string;
  description: string;
  price: number | null;
  category: string;
  availability: Availability;
  options?: ProductOption[];
}

/** Evita que Excel ejecute como fórmula un texto que empieza con = + - @. */
const guard = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);

export function exportRows(items: ExportItem[]): string[][] {
  return [
    [...IMPORT_HEADERS],
    ...items.map((i) => [guard(i.name), guard(i.description), centsToInput(i.price), guard(i.category), AVAILABILITY_TEXT[i.availability], guard(formatOptionsCell(i.options))]),
  ];
}

export function toCsv(rows: string[][]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // BOM para que Excel abra los acentos bien.
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
}

export const TEMPLATE_EXAMPLES: ExportItem[] = [
  { name: "Pastel de chocolate", description: "Para 10 personas, con ganache.", price: 450_00, category: "Pasteles", availability: "available", options: [{ name: "Tamaño", values: [{ label: "Chico" }, { label: "Mediano", extra: 100_00 }, { label: "Grande", extra: 200_00 }] }, { name: "Sabor", values: [{ label: "Chocolate" }, { label: "Vainilla" }, { label: "Zarzamora", extra: 20_00 }] }] },
  { name: "Caja de galletas", description: "12 piezas surtidas.", price: 180_00, category: "Galletas", availability: "available" },
  { name: "Mesa de postres para eventos", description: "Cotizamos según número de invitados.", price: null, category: "Eventos", availability: "onrequest" },
];
