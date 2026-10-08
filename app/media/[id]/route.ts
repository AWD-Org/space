import { NextResponse } from "next/server";
import { readImage } from "@/lib/storage/server";

export const runtime = "nodejs";

/** Sirve una foto de tienda. El id no cambia nunca de contenido, así que se cachea por un año. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await readImage(id);
  if (!img) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const cache = "public, max-age=31536000, immutable";
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": cache,
      "Netlify-CDN-Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
