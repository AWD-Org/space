"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppGlyph } from "@/components/catalog/bag-sheet";
import { CopyLink } from "./store-status";
import { Panel } from "./shell";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function ShareKit({ url, displayUrl, storeName, accent, published }: { url: string; displayUrl: string; storeName: string; accent: string; published: boolean }) {
  const [qr, setQr] = React.useState<string>("");
  const messages = [
    `Ya tengo catálogo. Ahí ves todo con precio y me mandas tu pedido por WhatsApp:\n${url}`,
    `¿Qué hay hoy? Todo está aquí con precios:\n${url}`,
  ];

  React.useEffect(() => {
    QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1E1F24", light: "#FFFFFF" }, errorCorrectionLevel: "M" }).then(setQr);
  }, [url]);

  const [busyQr, setBusyQr] = React.useState(false);
  const [busySign, setBusySign] = React.useState(false);

  async function downloadQr() {
    setBusyQr(true);
    try {
      const data = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: "#1E1F24", light: "#FFFFFF" } });
      const a = document.createElement("a");
      a.href = data;
      a.download = `qr-${displayUrl.split("/").pop()}.png`;
      a.click();
    } finally {
      setBusyQr(false);
    }
  }

  async function downloadSign() {
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754; // A5 vertical a 150 ppp aprox.
      const ctx = canvas.getContext("2d")!;
      const display = getComputedStyle(document.documentElement).getPropertyValue("--font-display") || "sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, canvas.width, 28);

      ctx.fillStyle = "#1E1F24";
      ctx.textAlign = "center";
      ctx.font = `600 104px ${display}`;
      const lines = wrap(ctx, storeName, 1040);
      lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 620, 240 + i * 116));

      ctx.font = `500 52px ${display}`;
      ctx.fillStyle = "#4B4F5C";
      ctx.fillText("Escanea, elige y pide por WhatsApp", 620, lines.length > 1 ? 520 : 410);

      const img = new Image();
      img.src = await QRCode.toDataURL(url, { width: 760, margin: 1, color: { dark: "#1E1F24", light: "#FFFFFF" } });
      await img.decode();
      const top = lines.length > 1 ? 600 : 490;
      ctx.drawImage(img, 240, top, 760, 760);

      ctx.font = `500 44px ${display}`;
      ctx.fillStyle = "#1E1F24";
      ctx.fillText(displayUrl, 620, top + 860);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `letrero-${displayUrl.split("/").pop()}.png`;
      a.click();
    } catch {
      toast.error("No se pudo crear el letrero. Intenta de nuevo.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {!published && (
        <p className="rounded-xl bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C2D12]">Tu catálogo sigue en borrador. Publícalo desde Inicio para que el link funcione con otras personas.</p>
      )}

      <Panel title="Tu link">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 truncate font-display text-lg font-semibold text-ink sm:text-xl">{displayUrl}</p>
          <CopyLink url={url} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Ponlo en tu bio de Instagram, en tu estado de WhatsApp y en los grupos de tu salón.</p>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.2fr]">
        <Panel title="Código QR">
          {qr ? (
            <div className="mx-auto aspect-square w-full max-w-[240px] rounded-xl bg-white p-2 ring-1 ring-ink/10" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label={`Código QR de ${displayUrl}`} />
          ) : (
            <div className="skeleton mx-auto aspect-square w-full max-w-[240px] rounded-xl" role="status" aria-label="Generando código QR" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={downloadQr} loading={busyQr} loadingText="Preparando…">
              <Download />
              Descargar QR
            </Button>
            <Button variant="secondary" size="sm" onClick={async () => { setBusySign(true); try { await downloadSign(); } finally { setBusySign(false); } }} loading={busySign} loadingText="Preparando…">
              <Printer />
              Letrero para imprimir
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">El letrero lleva tu nombre, el QR y el link. Pégalo en tu puesto, tu mochila o el refri.</p>
        </Panel>

        <Panel title="Mensajes listos para mandar">
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m} className="rounded-xl bg-cloud p-4">
                <p className="whitespace-pre-line break-words text-[0.95rem] text-ink">{m}</p>
                <div className="mt-3 flex gap-2">
                  <CopyLink url={m} label="Copiar" />
                  <Button asChild variant="whatsapp" size="sm">
                    <a href={`https://wa.me/?text=${encodeURIComponent(m)}`} target="_blank" rel="noopener">
                      <WhatsAppGlyph className="h-4 w-4" />
                      Enviar
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
