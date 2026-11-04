import "server-only";


/** Arma el .xlsx del catálogo o de la plantilla. Las celdas van como texto o número: nunca como fórmula. */
export async function buildXlsx(rows: string[][], sheet: string): Promise<Buffer> {
  const { default: writeExcelFile } = await import("write-excel-file/node");
  const [head, ...body] = rows;
  const data = [
    head!.map((value) => ({ value, fontWeight: "bold" as const, backgroundColor: "#E8ECFD" })),
    ...body.map((r) =>
      r.map((value, col) => {
        if (col === 2 && value !== "" && Number.isFinite(Number(value))) return { value: Number(value), type: Number, format: '"$"#,##0.00' };
        return { value: /^'[=+\-@]/.test(value) ? value.slice(1) : value, type: String };
      })
    ),
  ];
  const columns = [{ width: 34 }, { width: 48 }, { width: 14 }, { width: 20 }, { width: 18 }];
  const out = await writeExcelFile(data as any, { columns, sheet }).toBuffer();
  return Buffer.from(out);
}
