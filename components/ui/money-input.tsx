"use client";

import * as React from "react";
import { groupDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Limpia a "1234.5": solo dígitos y un punto decimal con máximo 2 decimales. */
function clean(text: string): string {
  const t = text.replace(/,/g, "").replace(/[^\d.]/g, "");
  const i = t.indexOf(".");
  if (i === -1) return t.replace(/^0+(?=\d)/, "").slice(0, 9);
  const int = t.slice(0, i).replace(/^0+(?=\d)/, "").slice(0, 9) || "0";
  return `${int}.${t.slice(i + 1).replace(/\./g, "").slice(0, 2)}`;
}

/**
 * Campo de precio en pesos mexicanos. `value` va sin formato ("4000.5");
 * se muestra como "4,000.5" con $ al inicio y MXN al final.
 */
export function MoneyInput({ id, value, onChange, placeholder = "45", className, ...rest }: {
  id?: string;
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode">) {
  const ref = React.useRef<HTMLInputElement>(null);
  const caret = React.useRef<number | null>(null);
  const shown = groupDigits(value);

  React.useLayoutEffect(() => {
    if (caret.current != null && ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const pos = el.selectionStart ?? el.value.length;
    // cuántos caracteres "reales" (no comas) hay antes del cursor
    const before = el.value.slice(0, pos).replace(/,/g, "").length;
    const next = clean(el.value);
    const formatted = groupDigits(next);
    let seen = 0;
    let at = formatted.length;
    if (before === 0) at = 0;
    else
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ",") seen++;
        if (seen >= before) {
          at = i + 1;
          break;
        }
      }
    caret.current = at;
    onChange(next);
  }

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>
        $
      </span>
      <input
        {...rest}
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="next"
        value={shown}
        onChange={handle}
        placeholder={placeholder}
        className="flex h-12 w-full rounded-xl border border-input bg-white pl-8 pr-16 text-base tabular-nums text-ink transition-colors placeholder:text-slate/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60 aria-[invalid=true]:border-destructive"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground" aria-hidden>
        MXN
      </span>
    </div>
  );
}
