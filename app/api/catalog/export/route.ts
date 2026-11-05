import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getStore, listCategories, listProducts } from "@/lib/data/queries";
import { exportRows, toCsv } from "@/lib/catalog-io";
import { buildXlsx } from "@/lib/catalog-xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Descarga el catálogo en el mismo formato que acepta la importación. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });
  const store = await getStore(user.uid);
  if (!store) return NextResponse.json({ ok: false, error: "Primero crea tu tienda." }, { status: 400 });
  const [products, categories] = await Promise.all([listProducts(user.uid), listCategories(user.uid)]);
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const rows = exportRows(
    products.map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.categoryId ? (cat.get(p.categoryId) ?? "") : "",
      availability: p.availability,
      options: p.options,
      stock: p.stock ?? null,
    }))
  );
  const base = `catalogo-${store.slug}`;
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (req.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` } });
  }
  const buf = await buildXlsx(rows, "Catálogo");
  return new NextResponse(new Uint8Array(buf), {
    headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${base}.xlsx"` },
  });
}
