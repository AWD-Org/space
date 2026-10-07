"use client";

import imageCompression from "browser-image-compression";
import type { ImageRef } from "@/lib/types";

export const MAX_ORIGINAL_MB = 8;

/** Comprime en el navegador (WebP, 1600 px) y sube al servidor. */
export async function uploadImage(file: File, kind: "product" | "logo" = "product"): Promise<ImageRef> {
  if (!file.type.startsWith("image/")) throw new Error("Ese archivo no es una foto.");
  if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) throw new Error(`La foto pesa más de ${MAX_ORIGINAL_MB} MB.`);

  let compressed: Blob = file;
  try {
    compressed = await imageCompression(file, {
      maxWidthOrHeight: kind === "logo" ? 512 : 1600,
      maxSizeMB: kind === "logo" ? 0.15 : 0.35,
      fileType: "image/webp",
      initialQuality: 0.82,
      useWebWorker: true,
    });
  } catch {
    throw new Error("No pudimos procesar esa foto. Prueba con otra.");
  }

  const body = new FormData();
  body.append("file", new File([compressed], "foto.webp", { type: compressed.type || "image/webp" }));
  body.append("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; image?: ImageRef; error?: string };
  if (!res.ok || !json.ok || !json.image) throw new Error(json.error || "No se pudo subir la foto.");
  return json.image;
}
