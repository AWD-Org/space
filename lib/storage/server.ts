import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { isLocalMode } from "@/lib/env";
import { adminBucket } from "@/lib/firebase/admin";
import type { ImageRef } from "@/lib/types";

const LOCAL_DIR = path.join(process.cwd(), ".local-data", "uploads");

export function ownsPath(uid: string, p: string) {
  return p.startsWith(`u/${uid}/`) && !p.includes("..");
}

export async function saveImage(p: string, data: Buffer, contentType: string): Promise<ImageRef> {
  if (isLocalMode) {
    const file = path.join(LOCAL_DIR, p);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    return { path: p, url: `/api/local-files/${p}` };
  }
  const bucket = adminBucket();
  await bucket.file(p).save(data, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  // Lectura pública permitida por storage.rules en u/**
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(p)}?alt=media`;
  return { path: p, url };
}

export async function removeImages(paths: string[]) {
  await Promise.all(
    paths.map(async (p) => {
      try {
        if (isLocalMode) await fs.unlink(path.join(LOCAL_DIR, p));
        else await adminBucket().file(p).delete({ ignoreNotFound: true });
      } catch {
        /* si ya no existe no pasa nada */
      }
    })
  );
}

export async function readLocalFile(p: string) {
  if (!isLocalMode || p.includes("..")) return null;
  try {
    return await fs.readFile(path.join(LOCAL_DIR, p));
  } catch {
    return null;
  }
}
