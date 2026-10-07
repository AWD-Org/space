"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

/** En móvil sale desde abajo; en escritorio es un panel a la derecha o un modal centrado. */
export function SheetContent({
  title,
  description,
  side = "bottom",
  className,
  children,
  hideTitle,
  style,
}: {
  title: string;
  description?: string;
  side?: "bottom" | "right" | "center";
  className?: string;
  children: React.ReactNode;
  hideTitle?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content
        style={style}
        className={cn(
          "fixed z-50 flex flex-col bg-white shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[86dvh] sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-[state=open]:slide-in-from-bottom-4 sm:data-[state=closed]:slide-out-to-bottom-4",
          side === "right" &&
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-3xl sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right",
          side === "center" &&
            "left-1/2 top-1/2 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", hideTitle && "absolute right-0 top-0 z-20 p-3 sm:p-3")}>
          <div className={cn(hideTitle && "sr-only")}>
            <Dialog.Title className="font-display text-xl font-semibold text-ink">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>}
          </div>
          {!description && hideTitle && <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          <Dialog.Close
            className={cn("-mr-2 ml-auto rounded-full p-2 text-slate hover:bg-ink/5 hover:text-ink", hideTitle && "mr-0 bg-white/95 text-ink shadow-md hover:bg-white")}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
