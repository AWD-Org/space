"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Celular mexicano a 10 dígitos. Solo acepta números, quita espacios, guiones y el +52
 * (también al pegar) y nunca pasa de 10. `value` y `onChange` trabajan con los dígitos limpios.
 */
export const PhoneInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (digits: string) => void;
    onBlur?: () => void;
    id?: string;
    name?: string;
    invalid?: boolean;
    autoComplete?: string;
    className?: string;
  }
>(({ value, onChange, onBlur, id, name, invalid, autoComplete = "tel-national", className }, ref) => (
  <div
    className={cn(
      "flex h-12 items-center overflow-hidden rounded-xl border border-input bg-white transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
      invalid && "border-destructive focus-within:border-destructive focus-within:ring-destructive/10",
      className
    )}
  >
    <span className="border-r border-input pl-4 pr-3 text-muted-foreground" aria-hidden>
      +52
    </span>
    <input
      ref={ref}
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      enterKeyHint="next"
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(phoneDigits(e.target.value))}
      onBlur={onBlur}
      aria-invalid={invalid || undefined}
      placeholder="5512345678"
      className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums text-ink placeholder:text-slate/80 focus:outline-none"
    />
    {value.length === 10 && <Check className="mr-4 h-4 w-4 shrink-0 text-[#1A8D4A]" aria-label="Número completo" />}
  </div>
));
PhoneInput.displayName = "PhoneInput";
