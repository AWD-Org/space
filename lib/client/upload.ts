"use client";

import type { ImageRef } from "@/lib/types";

export const MAX_ORIGINAL_MB = 30;

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

/** Algunos iPhone entregan la foto sin tipo MIME (por ejemplo desde Archivos), así que también se mira la extensión. */
function looksLikeImage(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

function isHeic(file: File) {
  return /heic|heif/i.test(file.type) || HEIC_EXT.test(file.name);
}

/** Decodifica con el navegador (respeta la orientación EXIF). Safari lee HEIC de forma nativa. */
async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* se prueba con <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Respaldo sin librerías ni workers (en iPhone el worker o el canvas fuera de pantalla fallan a menudo con fotos grandes).
 * Reduce al lado máximo y codifica en WebP; Safari antiguo no sabe WebP y devuelve PNG, así que en ese caso usa JPEG.
 */
async function canvasCompress(file: File, side: number, maxBytes: number): Promise<Blob> {
  const dec = await decode(file);
  try {
    if (!dec.width || !dec.height) throw new Error("empty");
    const scale = Math.min(1, side / Math.max(dec.width, dec.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(dec.width * scale));
    canvas.height = Math.max(1, Math.round(dec.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-canvas");
    ctx.drawImage(dec.source, 0, 0, canvas.width, canvas.height);
    let best: Blob | null = null;
    for (const type of ["image/webp", "image/jpeg"]) {
      for (const q of [0.82, 0.7, 0.58]) {
        const blob = await toBlob(canvas, type, q);
        if (!blob || blob.type !== type) break; // el navegador no soporta ese formato
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= maxBytes) return blob;
      }
      if (best) break;
    }
    if (!best) throw new Error("encode");
    return best;
  } finally {
    dec.close();
  }
}

/** Comprime en el navegador (WebP, 1600 px) y sube al servidor. */
export async function uploadImage(file: File, kind: "product" | "logo" = "product"): Promise<ImageRef> {
  if (!looksLikeImage(file)) throw new Error("Ese archivo no es una foto.");
  if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) throw new Error(`La foto pesa más de ${MAX_ORIGINAL_MB} MB.`);

  const side = kind === "logo" ? 512 : 1600;
  const maxMB = kind === "logo" ? 0.15 : 0.35;
  const opts = { maxWidthOrHeight: side, maxSizeMB: maxMB, fileType: "image/webp", initialQuality: 0.82 } as const;

  let compressed: Blob | null = null;
  try {
    const imageCompression = (await import("browser-image-compression")).default;
    try {
      compressed = await imageCompression(file, { ...opts, useWebWorker: true });
    } catch {
      // En iPhone el web worker falla con fotos grandes o HEIC: se reintenta en el hilo principal.
      compressed = await imageCompression(file, { ...opts, useWebWorker: false });
    }
  } catch {
    try {
      compressed = await canvasCompress(file, side, maxMB * 1024 * 1024);
    } catch {
      throw new Error(
        isHeic(file)
          ? "Este navegador no puede leer fotos HEIC. Súbela desde tu iPhone o conviértela a JPG."
          : "No pudimos leer esa foto. Prueba con una JPG, PNG o WebP."
      );
    }
  }

  const ext = compressed.type === "image/jpeg" ? "jpg" : compressed.type === "image/png" ? "png" : "webp";
  const body = new FormData();
  body.append("file", new File([compressed], `foto.${ext}`, { type: compressed.type || "image/webp" }));
  body.append("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; image?: ImageRef; error?: string };
  if (!res.ok || !json.ok || !json.image) throw new Error(json.error || "No se pudo subir la foto.");
  return json.image;
}
