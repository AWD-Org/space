import { NextResponse } from "next/server";
import { readLocalFile } from "@/lib/storage/server";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

/** Solo en modo local: sirve las fotos guardadas en .local-data/uploads. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = path.join("/");
  const data = await readLocalFile(p);
  if (!data) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": TYPES[p.split(".").pop() ?? ""] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" },
  });
}
