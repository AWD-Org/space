"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { ACCENTS } from "@/lib/validators";
import { ensureReadable, normalizeHex } from "@/lib/color";
import { cn } from "@/lib/utils";

/** Colores sugeridos de Space más un selector libre: cualquier código de color sirve. */
export function ColorPicker({ value, onChange, label = "Color de tu tienda" }: { value: string; onChange: (hex: string) => void; label?: string }) {
  const preset = ACCENTS.find((a) => a.value.toLowerCase() === value.toLowerCase());
  const [open, setOpen] = React.useState(!preset);
  const [text, setText] = React.useState(value.replace("#", ""));
  const [note, setNote] = React.useState(false);

  React.useEffect(() => {
    setText(value.replace("#", ""));
  }, [value]);

  function commit(raw: string) {
    const hex = normalizeHex(raw);
    if (!hex) return;
    const r = ensureReadable(hex);
    setNote(r.adjusted);
    onChange(r.hex);
  }

  return (
    <div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2.5">
        {ACCENTS.map((a) => {
          const on = !!preset && preset.value === a.value;
          return (
            <button
              key={a.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={a.label}
              title={a.label}
              onClick={() => {
                setNote(false);
                onChange(a.value);
              }}
              style={{ backgroundColor: a.value }}
              className={cn("grid h-10 w-10 place-items-center rounded-full text-white outline-offset-2 transition-transform duration-200 hover:scale-110 active:scale-95", on && "ring-2 ring-ink ring-offset-2")}
            >
              {on && <Check className="h-4 w-4" aria-hidden />}
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px bg-ink/10" aria-hidden />
        <button
          type="button"
          role="radio"
          aria-checked={!preset}
          aria-label="Color personalizado"
          title="Color personalizado"
          onClick={() => setOpen((o) => !o)}
          style={!preset ? { backgroundColor: value } : { background: "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)" }}
          className={cn("grid h-10 w-10 place-items-center rounded-full text-white outline-offset-2 transition-transform duration-200 hover:scale-110 active:scale-95", !preset && "ring-2 ring-ink ring-offset-2")}
        >
          {!preset ? <Check className="h-4 w-4" aria-hidden /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink"><Plus className="h-3.5 w-3.5" aria-hidden /></span>}
        </button>
      </div>

      {open && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cloud p-3">
          <label className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-ink/10" style={{ backgroundColor: value }}>
            <span className="sr-only">Elegir color en el selector</span>
            <input type="color" value={value.toLowerCase()} onChange={(e) => commit(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          </label>
          <div className="min-w-0 flex-1">
            <label htmlFor="accent-hex" className="text-xs font-medium text-muted-foreground">
              Código de color
            </label>
            <div className="mt-1 flex h-10 items-center rounded-xl bg-white px-3 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-blueInk">
              <span className="text-muted-foreground">#</span>
              <input
                id="accent-hex"
                value={text}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9a-fA-F#]/g, "").replace("#", "").slice(0, 6);
                  setText(v);
                  if (v.length === 6 || v.length === 3) commit(v);
                }}
                onBlur={() => setText(value.replace("#", ""))}
                maxLength={7}
                spellCheck={false}
                autoComplete="off"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                enterKeyHint="done"
                placeholder="3B55E6"
                className="h-full w-full bg-transparent pl-1 font-mono text-sm uppercase text-ink outline-none"
              />
            </div>
          </div>
        </div>
      )}
      {open && note && <p className="mt-2 text-xs text-muted-foreground">Lo oscurecimos un poco para que el texto blanco se lea bien sobre tu color.</p>}
    </div>
  );
}
