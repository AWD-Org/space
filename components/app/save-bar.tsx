"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * Barra de cambios sin guardar. Va dentro de un <form>: aparece sola cuando hay cambios
 * y el botón envía el formulario. Es la misma en tienda y en producto.
 */
export function SaveBar({
  dirty,
  saving,
  onDiscard,
  saveLabel = "Guardar cambios",
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  saveLabel?: string;
}) {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-40 px-4 sm:px-6 lg:bottom-6 lg:left-[248px] lg:px-6"
        >
          <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-full bg-blueInk py-2 pl-5 pr-2 text-white shadow-[0_18px_40px_-12px_rgba(59,85,230,0.55)]" role="region" aria-label="Cambios sin guardar">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              <span className="sm:hidden">Sin guardar</span>
              <span className="hidden sm:inline">Tienes cambios sin guardar</span>
            </p>
            <button type="button" onClick={onDiscard} disabled={saving} className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white disabled:opacity-50">
              Descartar
            </button>
            <Button type="submit" size="sm" className="h-10 bg-white px-5 text-blueInk hover:bg-spaceMist" loading={saving} loadingText="Guardando…">
              {saveLabel}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
