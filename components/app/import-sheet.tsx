"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "@/lib/toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { safe } from "@/lib/client/safe-action";
import { importProducts } from "@/lib/actions/import";
import { formatPrice } from "@/lib/format";
import type { ParsedRow } from "@/lib/catalog-io";
import type { Availability } from "@/lib/types";

interface Preview {
  rows: ParsedRow[];
  issues: { row: number; message: string }[];
  willCreate: number;
  sample: { name: string; price: number | null; category: string; availability: Availability }[];
  newCategories: string[];
  alreadyExist: number;
  repeatedInFile: number;
  overLimit: number;
  withoutCategoryByLimit: number;
  limits: { products: number; categories: number };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ImportSheet({ open, onOpenChange, hasProducts }: { open: boolean; onOpenChange: (o: boolean) => void; hasProducts: boolean }) {
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState<"read" | "save" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [fileName, setFileName] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setFileName("");
      setBusy(null);
    }
  }, [open]);

  async function onFile(file?: File) {
    if (!file) return;
    setError(null);
    setPreview(null);
    setFileName(file.name);
    setBusy("read");
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/catalog/import", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        window.location.assign(`/entrar?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!json?.ok) setError(json?.error ?? "No pudimos leer ese archivo.");
      else setPreview(json as Preview);
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function confirm() {
    if (!preview) return;
    setBusy("save");
    const res = await toast.task(() => safe(() => importProducts(preview.rows)), {
      loading: "Importando tu catálogo…",
      showError: false,
      success: (r) => {
        const { created, categoriesCreated } = r.ok ? r.data! : { created: 0, categoriesCreated: 0 };
        return `Importamos ${plural(created, "producto", "productos")}${categoriesCreated ? ` y creamos ${plural(categoriesCreated, "categoría", "categorías")}` : ""}.`;
      },
    });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    onOpenChange(false);
    router.refresh();
  }

  const p = preview;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Importar y exportar" description="Sube tu catálogo desde Excel o CSV, o descarga el que ya tienes.">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-6 pt-4 sm:px-6">
          <section aria-labelledby="imp-title">
            <h3 id="imp-title" className="font-medium text-ink">
              Subir productos
            </h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Descarga la plantilla (
                <a className="font-medium text-primary hover:underline" href="/api/catalog/template" download>
                  Excel
                </a>{" "}
                o{" "}
                <a className="font-medium text-primary hover:underline" href="/api/catalog/template?format=csv" download>
                  CSV
                </a>
                ).
              </li>
              <li>Llénala con tus productos o servicios. Respeta los encabezados.</li>
              <li>Súbela aquí y revisa lo que vamos a importar antes de guardar.</li>
            </ol>
            <p className="mt-2 text-sm text-muted-foreground">
              La categoría es opcional: si la pones, la creamos por ti sin repetirla. Las fotos las subes después, producto por producto.
            </p>

            <input ref={input} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="secondary" className="mt-3" onClick={() => input.current?.click()} disabled={busy !== null}>
              {busy === "read" ? <Loader2 className="animate-spin" /> : <Upload />}
              {busy === "read" ? "Leyendo…" : fileName ? "Elegir otro archivo" : "Elegir archivo"}
            </Button>
            {fileName && <p className="mt-2 flex items-center gap-1.5 text-sm text-ink"><FileSpreadsheet className="h-4 w-4 text-slate" aria-hidden />{fileName}</p>}

            {error && (
              <p role="alert" className="mt-3 flex gap-2 rounded-xl bg-[#FDECEA] px-4 py-3 text-sm text-[#8A1C12]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            {p && (
              <div className="mt-4 space-y-3" aria-live="polite">
                <div className="rounded-xl bg-cloud px-4 py-3">
                  <p className="font-medium text-ink">
                    {p.willCreate > 0 ? `Vamos a importar ${plural(p.willCreate, "producto", "productos")}` : "No hay productos nuevos para importar"}
                  </p>
                  {p.newCategories.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Categorías nuevas: {p.newCategories.join(", ")}.
                    </p>
                  )}
                  {p.sample.length > 0 && (
                    <ul className="mt-2 divide-y divide-ink/10 text-sm">
                      {p.sample.map((s, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
                          <span className="min-w-0 truncate text-ink">{s.name}{s.category && <span className="text-muted-foreground"> · {s.category}</span>}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{formatPrice(s.price)}</span>
                        </li>
                      ))}
                      {p.willCreate > p.sample.length && <li className="py-1.5 text-muted-foreground">y {p.willCreate - p.sample.length} más…</li>}
                    </ul>
                  )}
                </div>

                {(p.alreadyExist > 0 || p.repeatedInFile > 0 || p.overLimit > 0 || p.withoutCategoryByLimit > 0 || p.issues.length > 0) && (
                  <ul className="space-y-1 rounded-xl bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C2D12]">
                    {p.alreadyExist > 0 && <li>{plural(p.alreadyExist, "producto ya existe", "productos ya existen")} en tu catálogo y no se importa{p.alreadyExist === 1 ? "" : "n"}.</li>}
                    {p.repeatedInFile > 0 && <li>{plural(p.repeatedInFile, "fila repite", "filas repiten")} un nombre del mismo archivo; solo entra la primera.</li>}
                    {p.overLimit > 0 && <li>{plural(p.overLimit, "producto no cabe", "productos no caben")}: tu plan gratis permite {p.limits.products}. Borra algunos o quita filas del archivo.</li>}
                    {p.withoutCategoryByLimit > 0 && <li>{plural(p.withoutCategoryByLimit, "producto queda", "productos quedan")} sin categoría: tu plan gratis permite {p.limits.categories} categorías.</li>}
                    {p.issues.length > 0 && (
                      <li>
                        {plural(p.issues.length, "fila tiene error y se omite", "filas tienen errores y se omiten")}:
                        <ul className="mt-1 list-disc pl-5">
                          {p.issues.slice(0, 5).map((i) => (
                            <li key={i.row}>{i.message}</li>
                          ))}
                          {p.issues.length > 5 && <li>y {p.issues.length - 5} más.</li>}
                        </ul>
                      </li>
                    )}
                  </ul>
                )}

                <Button type="button" className="w-full" onClick={confirm} disabled={p.willCreate === 0 || busy !== null} loading={busy === "save"} loadingText="Importando…">
                  Importar {p.willCreate > 0 ? plural(p.willCreate, "producto", "productos") : ""}
                </Button>
              </div>
            )}
          </section>

          <section aria-labelledby="exp-title" className="border-t border-ink/10 pt-5">
            <h3 id="exp-title" className="font-medium text-ink">
              Descargar mi catálogo
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Una copia con tus productos, para editarla en Excel o guardarla de respaldo.</p>
            {hasProducts ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <a href="/api/catalog/export" download>
                    <Download />
                    Excel
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <a href="/api/catalog/export?format=csv" download>
                    <Download />
                    CSV
                  </a>
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Cuando tengas productos podrás descargarlos aquí.</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
