import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** "field" para formularios, "pill" para filtros y estados dentro de listas. */
  variant?: "field" | "pill";
  wrapperClassName?: string;
};

/** Select nativo con flecha propia y aire a los lados. */
export const Select = React.forwardRef<HTMLSelectElement, Props>(({ className, wrapperClassName, variant = "field", children, ...props }, ref) => (
  <div className={cn("relative", variant === "field" && "w-full", wrapperClassName)}>
    <select
      ref={ref}
      className={cn(
        "w-full cursor-pointer appearance-none text-ink focus:outline-none disabled:opacity-60",
        variant === "field"
          ? "h-12 rounded-xl border border-input bg-white pl-4 pr-11 text-base transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
          : "h-10 rounded-full bg-cloud pl-4 pr-10 text-sm font-medium ring-1 ring-inset ring-border transition-shadow focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground", variant === "field" ? "right-4 h-5 w-5" : "right-3.5 h-4 w-4")} aria-hidden />
  </div>
));
Select.displayName = "Select";
