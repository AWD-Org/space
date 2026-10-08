import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { isLocalMode } from "@/lib/env";
import { adminDb } from "@/lib/firebase/admin";
import type { ImageRef } from "@/lib/types";

/**
 * Las fotos viven en Firestore (colección `images`, una por documento, ya comprimidas a menos de ~900 KB)
 * y se sirven por /media/[id] con caché larga. Así Space funciona en el plan Spark de Firebase,
 * que no incluye Cloud Storage. En modo local se guardan en .local-data/uploads.
 */

const LOCAL_DIR = path.join(process.cwd(), ".local-data", "uploads");
const COLLECTION = "images";
export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{9,199}$/;

/** "u/{uid}/{tipo}/{nombre}" → "{uid}.{tipo}.{nombre}" */
function idFromPath(p: string) {
  return p.split("/").slice(1).join(".");
}

export function ownsPath(uid: string, p: string) {
  return /^u\/[A-Za-z0-9_-]+\/(product|logo)\/[A-Za-z0-9._-]+$/.test(p) && p.startsWith(`u/${uid}/`) && !p.includes("..");
}

export async function saveImage(p: string, data: Buffer, contentType: string): Promise<ImageRef> {
  const id = idFromPath(p);
  if (isLocalMode) {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DIR, id), data);
    return { path: p, url: `/media/${id}` };
  }
  const [, uid] = p.split("/");
  await adminDb().doc(`${COLLECTION}/${id}`).set({ ownerId: uid, path: p, contentType, size: data.length, bytes: data, createdAt: Date.now() });
  return { path: p, url: `/media/${id}` };
}

export async function removeImages(paths: string[]) {
  await Promise.all(
    paths.map(async (p) => {
      try {
        const id = idFromPath(p);
        if (isLocalMode) await fs.unlink(path.join(LOCAL_DIR, id));
        else await adminDb().doc(`${COLLECTION}/${id}`).delete();
      } catch {
        /* si ya no existe no pasa nada */
      }
    })
  );
}

const EXT_TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

export async function readImage(id: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!ID_PATTERN.test(id) || id.includes("..")) return null;
  try {
    if (isLocalMode) {
      const data = await fs.readFile(path.join(LOCAL_DIR, id));
      return { data, contentType: EXT_TYPES[id.split(".").pop() ?? ""] ?? "application/octet-stream" };
    }
    const snap = await adminDb().doc(`${COLLECTION}/${id}`).get();
    if (!snap.exists) return null;
    const d = snap.data() as { bytes?: Buffer | Uint8Array; contentType?: string };
    if (!d.bytes) return null;
    return { data: Buffer.from(d.bytes), contentType: d.contentType ?? "image/webp" };
  } catch {
    return null;
  }
}

/** Foto en JPEG de 600 px como data URL, para las imágenes de vista previa (next/og no lee WebP). */
export async function ogPhoto(url: string | undefined): Promise<string | null> {
  const id = url?.startsWith("/media/") ? url.slice("/media/".length) : null;
  if (!id) return null;
  try {
    const img = await readImage(id);
    if (!img) return null;
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(img.data).resize({ width: 600, height: 630, fit: "cover" }).jpeg({ quality: 72 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return null;
  }
}
