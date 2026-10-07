"use client";

import * as React from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { bagTotal, buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { useBag } from "./bag";
import { QtyStepper } from "./product-sheet";

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z" />
    </svg>
  );
}

export function BagSheet({
  open,
  onOpenChange,
  storeName,
  whatsapp,
  deliveryNote,
  onSend,
  demo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  storeName: string;
  whatsapp: string;
  deliveryNote: string;
  onSend?: (message: string) => void;
  demo?: boolean;
}) {
  const { items, setQty, clear, lines } = useBag();
  const [name, setName] = React.useState("");
  const [delivery, setDelivery] = React.useState("");
  const [note, setNote] = React.useState("");
  const { total, partial } = bagTotal(lines);

  const message = buildOrderMessage({ storeName, lines, customerName: name, delivery, note });

  function send() {
    onSend?.(message);
    if (!demo) window.open(whatsappLink(whatsapp, message), "_blank", "noopener");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Tu pedido" description={`Se lo mandas a ${storeName} por WhatsApp.`} side="right">
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-10 text-center">
            <div>
              <ShoppingBag className="mx-auto h-10 w-10 text-spaceLavender" aria-hidden />
              <p className="mt-3 text-muted-foreground">Tu bolsa está vacía. Toca el + de un producto para agregarlo.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
              <ul className="divide-y divide-ink/10">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-spaceMist">
                      {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{item.name}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">{formatPrice(item.price != null ? item.price * item.qty : null, item.priceFrom)}</p>
                    </div>
                    <QtyStepper value={item.qty} onChange={(n) => setQty(item.productId, n)} label={item.name} />
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="bag-name" className="text-sm font-medium text-ink">
                    Tu nombre
                  </label>
                  <Input id="bag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Para que sepa de quién es" autoComplete="given-name" className="mt-1.5" />
                </div>
                <div>
                  <label htmlFor="bag-delivery" className="text-sm font-medium text-ink">
                    ¿Dónde y cuándo lo recoges?
                  </label>
                  <Input
                    id="bag-delivery"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    placeholder={deliveryNote ? `Entrega: ${deliveryNote}` : "Ej. salida del edificio B a las 2"}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="bag-note" className="text-sm font-medium text-ink">
                    Nota (opcional)
                  </label>
                  <Textarea id="bag-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sabor, talla o lo que haga falta" className="mt-1.5 min-h-[72px]" />
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 bg-white px-5 pb-safe pt-4 sm:px-6 sm:pb-6">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-muted-foreground">Total{partial ? " aproximado" : ""}</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-ink">{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                onClick={send}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-whatsapp font-medium text-white transition-colors hover:bg-[#157540]"
              >
                <WhatsAppGlyph className="h-5 w-5" />
                Mandar pedido por WhatsApp
              </button>
              <button type="button" onClick={clear} className="mt-2 w-full py-2 text-sm text-muted-foreground hover:text-ink">
                Vaciar bolsa
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
