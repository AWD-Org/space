"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { OPTION_NAMES, type OptionName, type ProductOption } from "@/lib/types";
import { MAX_OPTION_VALUES, optionValueSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

const HINT: Record<OptionName, string> = {
  Talla: "Ej. CH, M, G o 28, 30, 32",
  Tamaño: "Ej. Chico, Mediano, Grande",
  Color: "Ej. Negro, Rosa, Azul marino",
};

/** Editor de variantes: solo Talla, Tamaño y Color, cada una con sus valores. */
export function VariantsEditor({ value, onChange }: { value: ProductOption[]; onChange: (next: ProductOption[]) => void }) {
  const byName = new Map(value.map((o) => [o.name, o]));
  const [drafts, setDrafts] = React.useState<Partial<Record<OptionName, string>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<OptionName, string>>>({});

  const emit = (name: OptionName, values: string[] | null) => {
    const rest = value.filter((o) => o.name !== name);
    const next = values ? [...rest, { name, values }] : rest;
    onChange(OPTION_NAMES.flatMap((n) => next.filter((o) => o.name === n)));
  };

  function addValue(name: OptionName) {
    const raw = (drafts[name] ?? "").trim();
    if (!raw) return;
    const parsed = optionValueSchema.safeParse(raw);
    const current = byName.get(name)?.values ?? [];
    const fail = (m: string) => setErrors((e) => ({ ...e, [name]: m }));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa el valor.");
    if (current.some((v) => v.toLowerCase() === parsed.data.toLowerCase())) return fail("Ese valor ya está.");
    if (current.length >= MAX_OPTION_VALUES) return fail(`Máximo ${MAX_OPTION_VALUES} valores.`);
    setErrors((e) => ({ ...e, [name]: undefined }));
    setDrafts((d) => ({ ...d, [name]: "" }));
    emit(name, [...current, parsed.data]);
  }

  return (
    <div className="space-y-3">
      {OPTION_NAMES.map((name) => {
        const opt = byName.get(name);
        const id = `var-${name}`;
        return (
          <div key={name} className="rounded-xl bg-cloud p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">{name}</p>
              {opt ? (
                <button type="button" onClick={() => emit(name, null)} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Quitar {name.toLowerCase()}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => emit(name, [])}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium text-ink ring-1 ring-inset ring-ink/15 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus className="h-4 w-4" aria-hidden /> Agregar {name.toLowerCase()}
                </button>
              )}
            </div>
            {opt && (
              <div className="mt-3">
                {opt.values.length > 0 && (
                  <ul className="mb-3 flex flex-wrap gap-2" aria-label={`Valores de ${name}`}>
                    {opt.values.map((v) => (
                      <li key={v} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1 text-sm font-medium text-ink ring-1 ring-inset ring-ink/15">
                        {v}
                        <button
                          type="button"
                          aria-label={`Quitar ${v} de ${name}`}
                          onClick={() => emit(name, opt.values.filter((x) => x !== v))}
                          className="grid h-7 w-7 place-items-center rounded-full text-ink/60 hover:bg-cloud hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    id={id}
                    value={drafts[name] ?? ""}
                    onChange={(e) => {
                      setDrafts((d) => ({ ...d, [name]: e.target.value }));
                      if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addValue(name);
                      }
                    }}
                    maxLength={20}
                    enterKeyHint="done"
                    autoCapitalize="sentences"
                    placeholder={HINT[name]}
                    aria-label={`Nuevo valor de ${name}`}
                    aria-invalid={!!errors[name]}
                    className={cn("h-12 min-w-0 flex-1 rounded-xl bg-white px-4 text-base text-ink ring-1 ring-inset ring-ink/15 placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-primary", errors[name] && "ring-destructive")}
                  />
                  <button type="button" onClick={() => addValue(name)} className="h-12 shrink-0 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    Agregar
                  </button>
                </div>
                {errors[name] && (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">
                    {errors[name]}
                  </p>
                )}
                {opt.values.length === 0 && !errors[name] && <p className="mt-1.5 text-sm text-muted-foreground">Agrega al menos un valor o quita {name.toLowerCase()}.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
