"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  count: number;
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="group flex min-h-9 cursor-pointer items-center gap-3 rounded-lg px-1 text-[0.95rem] text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2",
          checked ? "border-ink bg-ink text-white" : "border-ink/30 bg-white group-hover:border-ink/60"
        )}
        aria-hidden
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="tabular-nums text-sm text-slate">{count}</span>}
    </label>
  );
}

/** Filtros a la izquierda del listado (escritorio), al estilo de las tiendas grandes. */
export function FilterSidebar({
  categories,
  selected,
  onToggleCategory,
  hasSoldOut,
  onlyAvailable,
  onToggleAvailable,
  availableCount,
  showPrice,
  min,
  max,
  onMin,
  onMax,
  filtering,
  onClear,
}: {
  categories: FilterOption[];
  selected: string[];
  onToggleCategory: (id: string) => void;
  hasSoldOut: boolean;
  onlyAvailable: boolean;
  onToggleAvailable: () => void;
  availableCount: number;
  showPrice: boolean;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  filtering: boolean;
  onClear: () => void;
}) {
  const priceInput = "h-10 w-full rounded-lg border border-ink/15 bg-white pl-6 pr-2 text-sm tabular-nums text-ink placeholder:text-slate focus:border-ink focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
  return (
    <aside aria-label="Filtros" className="hidden lg:block">
      <div className="sticky top-[5.25rem] space-y-7">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Filtros</h2>
          {filtering && (
            <button type="button" onClick={onClear} className="text-sm font-medium text-ink underline underline-offset-4 hover:text-ink/70">
              Limpiar
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-display text-base font-semibold text-ink">Categoría</legend>
            {categories.map((c) => (
              <CheckRow key={c.id} checked={selected.includes(c.id)} onChange={() => onToggleCategory(c.id)} label={c.label} count={c.count} />
            ))}
          </fieldset>
        )}

        {hasSoldOut && (
          <fieldset>
            <legend className="mb-2 font-display text-base font-semibold text-ink">Disponibilidad</legend>
            <CheckRow checked={onlyAvailable} onChange={onToggleAvailable} label="Solo disponibles" count={availableCount} />
          </fieldset>
        )}

        {showPrice && (
          <fieldset>
            <legend className="mb-2 font-display text-base font-semibold text-ink">Precio (MXN)</legend>
            <div className="flex items-center gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Precio mínimo</span>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate" aria-hidden>$</span>
                <input inputMode="numeric" value={min} onChange={(e) => onMin(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="Mín." className={priceInput} />
              </label>
              <span className="text-slate" aria-hidden>–</span>
              <label className="relative flex-1">
                <span className="sr-only">Precio máximo</span>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate" aria-hidden>$</span>
                <input inputMode="numeric" value={max} onChange={(e) => onMax(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="Máx." className={priceInput} />
              </label>
            </div>
          </fieldset>
        )}
      </div>
    </aside>
  );
}
