"use client";

import { AlertTriangle, Check, Info, Loader2, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

const badge = "grid h-8 w-8 shrink-0 place-items-center rounded-full";

/** Avisos de Space: siempre arriba a la derecha, con el mismo estilo para éxito, error, aviso e info. */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      gap={10}
      duration={4500}
      visibleToasts={4}
      icons={{
        success: (
          <span className={`${badge} bg-[#E7F6EE] text-[#146C3B]`}>
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
          </span>
        ),
        error: (
          <span className={`${badge} bg-[#FDECEC] text-[#B42318]`}>
            <X className="h-4 w-4" strokeWidth={3} aria-hidden />
          </span>
        ),
        warning: (
          <span className={`${badge} bg-[#FEF3E2] text-[#B45309]`}>
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        ),
        info: (
          <span className={`${badge} bg-spaceMist text-blueInk`}>
            <Info className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        ),
        loading: (
          <span className={`${badge} bg-cloud text-ink`}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </span>
        ),
        close: <X className="h-3.5 w-3.5" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group pointer-events-auto relative flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 pr-11 font-sans text-ink shadow-[0_18px_40px_-12px_rgba(30,31,36,0.28)] ring-1 ring-ink/10 sm:w-[360px]",
          icon: "m-0 flex shrink-0 items-center",
          content: "min-w-0 flex-1",
          title: "text-[0.95rem] font-semibold leading-snug",
          description: "mt-0.5 text-sm leading-snug text-muted-foreground",
          closeButton:
            "!absolute !right-2.5 !top-2.5 !left-auto !bottom-auto !grid h-6 w-6 !translate-x-0 !translate-y-0 place-items-center rounded-full !border-0 !bg-transparent text-slate transition-colors hover:!bg-cloud hover:text-ink",
          actionButton: "ml-2 rounded-full bg-blueInk px-3 py-1.5 text-sm font-medium text-white",
          cancelButton: "ml-2 rounded-full bg-cloud px-3 py-1.5 text-sm font-medium text-ink",
        },
      }}
    />
  );
}
