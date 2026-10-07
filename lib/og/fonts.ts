import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const fontsDir = () => path.join(process.cwd(), "assets", "fonts");

/** Fuentes de marca para las imágenes al compartir (ImageResponse no acepta woff2). */
export async function ogFonts() {
  const [display, text] = await Promise.all([
    fs.readFile(path.join(fontsDir(), "funnel-display-latin-600-normal.woff")),
    fs.readFile(path.join(fontsDir(), "funnel-sans-latin-500-normal.woff")),
  ]);
  return [
    { name: "Funnel Display", data: display, weight: 600 as const, style: "normal" as const },
    { name: "Funnel Sans", data: text, weight: 500 as const, style: "normal" as const },
  ];
}
