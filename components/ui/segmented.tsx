"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-full bg-cloud p-1 ring-1 ring-inset ring-border", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
            value === o.value ? "bg-white text-ink shadow-sm" : "text-muted-foreground hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
