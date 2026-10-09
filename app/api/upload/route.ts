import { NextResponse, type NextRequest } from "next/server";
import { getDb, increment } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { getLimits, getStore, statsPath, storePath } from "@/lib/data/queries";
import { todayKey } from "@/lib/format";
import { removeImages, saveImage } from "@/lib/storage/server";
import { refreshStore } from "@/lib/actions/helpers";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Verifica los primeros bytes: el Content-Type lo manda el cliente y no es de fiar. */
function matchesSignature(b: Buffer, type: string) {
  if (type === "image/jpeg") return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

/** Sube una foto ya comprimida en el navegador. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "logo" ? "logo" : "product";
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No llegó ninguna foto." }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: "Usa una foto JPG, PNG o WebP." }, { status: 415 });

  const limits = await getLimits();
  if (file.size > limits.maxStoredBytes) {
    return NextResponse.json({ ok: false, error: "La foto pesa demasiado. Intenta con otra." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(bytes, file.type)) {
    return NextResponse.json({ ok: false, error: "Ese archivo no es una foto válida. Usa una foto JPG, PNG o WebP." }, { status: 415 });
  }

  const store = await getStore(user.uid);
  if (!store) return NextResponse.json({ ok: false, error: "Primero crea tu tienda." }, { status: 400 });

  const db = await getDb();
  // Tope diario de subidas para evitar abuso del almacenamiento.
  const dayPath = `${statsPath(user.uid)}/${todayKey()}`;
  const day = await db.get<{ uploads?: number }>(dayPath);
  if ((day?.uploads ?? 0) >= 80) {
    return NextResponse.json({ ok: false, error: "Subiste muchas fotos hoy. Vuelve a intentarlo mañana." }, { status: 429 });
  }
  await db.set(dayPath, { date: todayKey(), uploads: increment(1) }, { merge: true });

  const name = `${Date.now().toString(36)}-${db.newId().slice(0, 8)}.${ext}`;
  const image = await saveImage(`u/${user.uid}/${kind}/${name}`, bytes, file.type);

  if (kind === "logo") {
    const previous = store.logo?.path;
    await db.update(storePath(user.uid), { logo: image, updatedAt: Date.now() });
    if (previous) await removeImages([previous]);
    refreshStore(store.slug);
  }

  return NextResponse.json({ ok: true, image });
}
