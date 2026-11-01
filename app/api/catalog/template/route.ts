import { NextResponse, type NextRequest } from "next/server";
import { exportRows, TEMPLATE_EXAMPLES, toCsv } from "@/lib/catalog-io";
import { buildXlsx } from "@/lib/catalog-xlsx";

export const runtime = "nodejs";

/** Plantilla para llenar: encabezados y tres ejemplos que la persona reemplaza. Pública, no tiene datos de nadie. */
export async function GET(req: NextRequest) {
  const rows = exportRows(TEMPLATE_EXAMPLES);
  const headers = { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" };
  if (req.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="plantilla-space.csv"' } });
  }
  const buf = await buildXlsx(rows, "Productos");
  return new NextResponse(new Uint8Array(buf), {
    headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="plantilla-space.xlsx"' },
  });
}
