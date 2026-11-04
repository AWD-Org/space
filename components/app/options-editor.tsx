"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { OPTION_SUGGESTIONS, type OptionValue, type ProductOption } from "@/lib/types";
import { MAX_OPTION_GROUPS, MAX_OPTION_VALUES, optionLabelSchema } from "@/lib/validators";
import { centsToInput, parsePriceInput } from "@/lib/format";
import { cn } from "@/lib/utils";

const FIELD = "h-12 min-w-0 rounded-xl bg-white px-4 text-base text-ink ring-1 ring-inset ring-ink/15 placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-primary";
const GHOST = "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-ink ring-1 ring-inset ring-ink/15 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

function ExtraInput({ cents, onChange, label }: { cents: number | undefined; onChange: (c: number | undefined) => void; label: string }) {
  const [text, setText] = React.useState(cents ? centsToInput(cents) : "");
  React.useEffect(() => {
    if ((parsePriceInput(text) ?? 0) !== (cents ?? 0)) setText(cents ? centsToInput(cents) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents]);
  return (
    <label className="relative block w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
        + $
      </span>
      <input
        value={text}
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        placeholder="Extra"
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d.]/g, "");
          setText(v);
          const c = parsePriceInput(v);
          onChange(c && c > 0 ? c : undefined);
        }}
        className={cn(FIELD, "w-full pl-10")}
      />
    </label>
  );
}

/**
 * Editor de opciones: cada opción tiene un nombre libre (con sugerencias) y hasta 12 valores.
 * Cada valor puede sumar un precio extra y marcarse agotado.
 */
export function OptionsEditor({ value, onChange, hasPrice }: { value: ProductOption[]; onChange: (next: ProductOption[]) => void; hasPrice: boolean }) {
  const [drafts, setDrafts] = React.useState<Record<number, string>>({});
  const [errors, setErrors] = React.useState<Record<number, string | undefined>>({});
  const backup = React.useRef<ProductOption[]>([]);
  const on = value.length > 0;

  const setGroup = (gi: number, patch: Partial<ProductOption>) => onChange(value.map((o, i) => (i === gi ? { ...o, ...patch } : o)));
  const setValue = (gi: number, vi: number, patch: Partial<OptionValue>) =>
    setGroup(gi, { values: value[gi]!.values.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });

  function addValues(gi: number) {
    const raw = (drafts[gi] ?? "").trim();
    if (!raw) return;
    const group = value[gi]!;
    const fail = (m: string) => setErrors((e) => ({ ...e, [gi]: m }));
    const incoming = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...group.values];
    for (const label of incoming) {
      const parsed = optionLabelSchema.safeParse(label);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa el valor.");
      if (next.some((v) => v.label.toLowerCase() === parsed.data.toLowerCase())) return fail(`«${parsed.data}» ya está.`);
      if (next.length >= MAX_OPTION_VALUES) return fail(`Máximo ${MAX_OPTION_VALUES} valores.`);
      next.push({ label: parsed.data });
    }
    setErrors((e) => ({ ...e, [gi]: undefined }));
    setDrafts((d) => ({ ...d, [gi]: "" }));
    setGroup(gi, { values: next });
  }

  function toggle() {
    if (on) {
      backup.current = value;
      onChange([]);
    } else {
      onChange(backup.current.length ? backup.current : [{ name: "", values: [] }]);
    }
    setDrafts({});
    setErrors({});
  }

  const used = new Set(value.map((o) => o.name.trim().toLowerCase()));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p id="opt-switch-label" className="text-[0.95rem] font-medium text-ink">
            Este producto tiene opciones
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">Talla, tamaño, sabor… Quien pida elige antes de agregar. Déjalo apagado si es una pieza única.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="opt-switch-label"
          onClick={toggle}
          className={cn(
            "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            on ? "bg-primary" : "bg-ink/20"
          )}
        >
          <span className={cn("absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
        </button>
      </div>

      {on && (
        <div className="mt-4 space-y-3">
          {value.map((group, gi) => (
            <div key={gi} className="rounded-xl bg-cloud p-4">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`opt-name-${gi}`} className="mb-1.5 block text-sm font-medium text-ink">
                    Nombre de la opción
                  </label>
                  <input
                    id={`opt-name-${gi}`}
                    value={group.name}
                    maxLength={20}
                    autoComplete="off"
                    placeholder="Ej. Talla"
                    onChange={(e) => setGroup(gi, { name: e.target.value })}
                    className={cn(FIELD, "w-full")}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Quitar la opción ${group.name || gi + 1}`}
                  onClick={() => {
                    const next = value.filter((_, i) => i !== gi);
                    backup.current = next.length ? backup.current : value;
                    onChange(next);
                    setDrafts({});
                    setErrors({});
                  }}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-ink/60 hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Sugerencias de nombre">
                {OPTION_SUGGESTIONS.filter((n) => !used.has(n.toLowerCase()) || group.name.trim().toLowerCase() === n.toLowerCase()).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={group.name === n}
                    onClick={() => setGroup(gi, { name: n })}
                    className={cn(
                      "min-h-9 rounded-full px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      group.name === n ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-inset ring-ink/15 hover:bg-white/70"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {group.values.length > 0 && (
                <ul className="mt-4 space-y-2" aria-label={`Valores de ${group.name || "la opción"}`}>
                  {group.values.map((v, vi) => (
                    <li key={vi} className="rounded-xl bg-white p-3 ring-1 ring-inset ring-ink/10">
                      <div className="flex items-center gap-2">
                        <input
                          value={v.label}
                          maxLength={20}
                          aria-label={`Valor ${vi + 1} de ${group.name || "la opción"}`}
                          onChange={(e) => setValue(gi, vi, { label: e.target.value })}
                          className={cn(FIELD, "flex-1 bg-cloud ring-0")}
                        />
                        <button
                          type="button"
                          aria-label={`Quitar ${v.label || "valor"} de ${group.name || "la opción"}`}
                          onClick={() => setGroup(gi, { values: group.values.filter((_, i) => i !== vi) })}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/60 hover:bg-cloud hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        {hasPrice && (
                          <div className="w-32 shrink-0">
                            <ExtraInput cents={v.extra} onChange={(c) => setValue(gi, vi, { extra: c })} label={`Precio extra de ${v.label || "valor"}`} />
                          </div>
                        )}
                        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={!!v.soldOut}
                            onChange={(e) => setValue(gi, vi, { soldOut: e.target.checked || undefined })}
                            className="h-5 w-5 rounded accent-[#3B55E6]"
                          />
                          Agotado
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  value={drafts[gi] ?? ""}
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [gi]: e.target.value }));
                    if (errors[gi]) setErrors((x) => ({ ...x, [gi]: undefined }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValues(gi);
                    }
                  }}
                  enterKeyHint="done"
                  autoCapitalize="sentences"
                  placeholder="Ej. CH, M, G"
                  aria-label={`Nuevo valor de ${group.name || "la opción"}`}
                  aria-invalid={!!errors[gi]}
                  disabled={group.values.length >= MAX_OPTION_VALUES}
                  className={cn(FIELD, "flex-1", errors[gi] && "ring-destructive")}
                />
                <button
                  type="button"
                  onClick={() => addValues(gi)}
                  disabled={group.values.length >= MAX_OPTION_VALUES}
                  className="h-12 shrink-0 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              {errors[gi] ? (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors[gi]}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {group.values.length === 0 ? "Agrega al menos un valor. Puedes escribir varios separados por coma." : `${group.values.length} de ${MAX_OPTION_VALUES} valores.`}
                </p>
              )}
            </div>
          ))}

          {value.length < MAX_OPTION_GROUPS && (
            <button type="button" onClick={() => onChange([...value, { name: "", values: [] }])} className={GHOST}>
              <Plus className="h-4 w-4" aria-hidden /> Agregar otra opción
            </button>
          )}
          {!hasPrice && <p className="text-sm text-muted-foreground">Para sumar un precio extra por valor, primero escribe el precio del producto.</p>}
        </div>
      )}
    </div>
  );
}
