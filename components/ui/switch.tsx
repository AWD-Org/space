"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Interruptor con zona táctil de 44 px de alto (la pista visible mide 28 px y va centrada):
 * el botón completo es el objetivo, no solo la pista.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "group peer relative inline-flex h-11 w-14 shrink-0 cursor-pointer items-center rounded-full focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <span
      aria-hidden
      className="absolute left-1 top-2 h-7 w-12 rounded-full bg-[#C9CCD6] transition-colors group-focus-visible:ring-4 group-focus-visible:ring-primary/30 group-data-[state=checked]:bg-primary"
    />
    <SwitchPrimitive.Thumb className="pointer-events-none absolute left-1.5 top-2.5 block h-6 w-6 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
