import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getLimits, getStore, listCategories, listProducts } from "@/lib/data/queries";
import { rateLimited } from "@/lib/rate-limit";
import { decodeText, MAX_IMPORT_BYTES, MAX_XLSX_UNZIPPED_BYTES, parseCsv, parseTable, planImport, zipUncompressedSize } from "@/lib/catalog-io";

export const runtime = "nodejs";

/** Lee un CSV o Excel y devuelve una vista previa de lo que se importaría. No guarda nada. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });
  if (rateLimited(`import:${user.uid}`, 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No llegó ningún archivo." }, { status: 400 });
  if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ ok: false, error: "El archivo pesa demasiado (máximo 1 MB)." }, { status: 413 });

  const store = await getStore(user.uid);
  if (!store) return NextResponse.json({ ok: false, error: "Primero crea tu tienda." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  let table: unknown[][];
  try {
    if (ext === "xlsx") {
      // Los .xlsx son un zip que empieza con "PK". Si no, no es un Excel de verdad.
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("not-xlsx");
      const unzipped = zipUncompressedSize(bytes);
      if (unzipped === null || unzipped > MAX_XLSX_UNZIPPED_BYTES) throw new Error("zip-size");
      const { readSheet } = await import("read-excel-file/node");
      table = (await readSheet(bytes)) as unknown[][];
    } else if (ext === "csv" || ext === "txt") {
      table = parseCsv(decodeText(bytes));
    } else {
      return NextResponse.json({ ok: false, error: "Usa un archivo .xlsx (Excel) o .csv." }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "No pudimos leer ese archivo. Revisa que sea un Excel (.xlsx) o CSV sin protección." }, { status: 415 });
  }

  const parsed = parseTable(table);
  if (parsed.fatal) return NextResponse.json({ ok: false, error: parsed.fatal }, { status: 422 });

  const [limits, products, categories] = await Promise.all([getLimits(), listProducts(user.uid), listCategories(user.uid)]);
  const plan = planImport(parsed.rows, {
    existingNames: products.map((p) => p.name),
    existingCategories: categories.map((c) => c.name),
    productSlots: limits.products - products.length,
    categorySlots: limits.categories - categories.length,
  });

  return NextResponse.json({
    ok: true,
    totalRows: parsed.rows.length + parsed.issues.length,
    rows: parsed.rows,
    issues: parsed.issues,
    willCreate: plan.accepted.length,
    sample: plan.accepted.slice(0, 5).map((r) => ({ name: r.name, price: r.price, category: r.category, availability: r.availability })),
    newCategories: plan.newCategories,
    alreadyExist: plan.alreadyExist.length,
    repeatedInFile: plan.repeatedInFile.length,
    overLimit: plan.overLimit,
    withoutCategoryByLimit: plan.withoutCategoryByLimit,
    limits: { products: limits.products, categories: limits.categories },
  });
}
