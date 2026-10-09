"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Eye, MessageCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { setPublished, updateStore } from "@/lib/actions/store";

export function CopyLink({ url, label = "Copiar link" }: { url: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="soft"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("No se pudo copiar. Mantén presionado el link para copiarlo.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

export function StoreStatus({ url, displayUrl, published, isOpen, canPublish }: { url: string; displayUrl: string; published: boolean; isOpen: boolean; canPublish: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(isOpen);
  const [busy, setBusy] = React.useState(false);

  async function toggleOpen(v: boolean) {
    setOpen(v);
    const res = await updateStore({ isOpen: v });
    if (!res.ok) {
      setOpen(!v);
      toast.error(res.error);
    } else toast.success(v ? "Tu catálogo vuelve a recibir pedidos." : "Pausaste los pedidos. El catálogo sigue visible.");
  }

  async function publish() {
    setBusy(true);
    const res = await setPublished(true);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Tu catálogo ya está en línea.");
    router.refresh();
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{published ? "Tu catálogo está en línea" : "Tu catálogo es un borrador"}</p>
          <a href={url} target="_blank" rel="noopener" className="mt-0.5 block truncate font-display text-lg font-semibold text-ink underline-offset-4 hover:underline sm:text-xl">
            {displayUrl}
          </a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {published ? (
          <>
            <Button asChild variant="whatsapp" size="sm" className="flex-1 sm:flex-none">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Mira mi catálogo en Space®: ${url}`)}`} target="_blank" rel="noopener">
                <MessageCircle />
                Enviar por WhatsApp
              </a>
            </Button>
            <CopyLink url={url} />
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/compartir">
                <QrCode />
                QR y letrero
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={publish} loading={busy} loadingText="Publicando…" disabled={!canPublish}>
              Publicar catálogo
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={url} target="_blank" rel="noopener">
                <Eye />
                Vista previa
              </a>
            </Button>
          </>
        )}
      </div>
      {!published && !canPublish && <p className="mt-3 text-sm text-muted-foreground">Agrega tu primer producto para poder publicarlo.</p>}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-cloud px-4 py-3">
        <div>
          <p className="font-medium text-ink">Tomando pedidos hoy</p>
          <p className="text-sm text-muted-foreground">{open ? "La bolsa de pedido está activa." : "Pausado: se ve el catálogo, pero no se pueden mandar pedidos."}</p>
        </div>
        <Switch checked={open} onCheckedChange={toggleOpen} aria-label="Tomando pedidos hoy" />
      </div>
    </section>
  );
}
