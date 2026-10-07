import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-ink placeholder:text-slate/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60 aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-input bg-white px-4 py-3 text-base text-ink placeholder:text-slate/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
