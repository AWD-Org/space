"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/client/upload";
import type { ImageRef } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  max,
  onBusyChange,
}: {
  value: ImageRef[];
  onChange: (images: ImageRef[]) => void;
  max: number;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [pending, setPending] = React.useState(0);
  const input = React.useRef<HTMLInputElement>(null);
  const latest = React.useRef(value);
  latest.current = value;

  React.useEffect(() => onBusyChange?.(pending > 0), [pending, onBusyChange]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - latest.current.length - pending;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > list.length) toast.warning(`Cada producto lleva hasta ${max} fotos.`);
    setPending((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const image = await uploadImage(file);
          latest.current = [...latest.current, image];
          onChange(latest.current);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo subir la foto.");
        } finally {
          setPending((n) => n - 1);
        }
      })
    );
    if (input.current) input.current.value = "";
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.path} className="group relative aspect-square overflow-hidden rounded-xl bg-spaceMist">
            <Image src={img.url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[0.7rem] font-medium text-ink">Portada</span>}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v.path !== img.path))}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm"
              aria-label={`Quitar foto ${i + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
            {value.length > 1 && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm disabled:opacity-0" aria-label={`Mover foto ${i + 1} a la izquierda`}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm disabled:opacity-0" aria-label={`Mover foto ${i + 1} a la derecha`}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: pending }).map((_, i) => (
          <div key={`p${i}`} className="grid aspect-square place-items-center rounded-xl bg-spaceMist text-blueInk">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Subiendo foto" />
          </div>
        ))}
        {value.length + pending < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-spaceLavender bg-white text-sm font-medium text-blueInk transition-colors hover:bg-spaceMist/60"
            )}
          >
            <Camera className="h-6 w-6" aria-hidden />
            {value.length ? "Otra foto" : "Agregar foto"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} tabIndex={-1} aria-hidden />
      <p className="mt-2 text-sm text-muted-foreground">
        {max === 1 ? "Una foto." : `Hasta ${max} fotos.`} La primera es la portada. Se ajustan solas para que el catálogo cargue rápido.
      </p>
    </div>
  );
}
