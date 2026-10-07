import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/fonts";
import { loadCatalog } from "./data";
import { SITE_URL } from "@/lib/env";
import { storeInitials } from "@/lib/format";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Catálogo en Space";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadCatalog(slug);
  const store = result?.catalog.store;
  const photos = (result?.catalog.products ?? [])
    .map((p) => p.images[0]?.url)
    .filter((u): u is string => Boolean(u && u.startsWith("http")))
    .slice(0, 4);
  const accent = store?.accent ?? "#3B55E6";
  const name = store?.name ?? "Space";
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4F5F8", fontFamily: "Funnel Sans" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: photos.length ? 600 : 1200, padding: 64 }}>
          <div style={{ display: "flex", width: 96, height: 96, borderRadius: 24, background: accent, color: "white", fontSize: 40, alignItems: "center", justifyContent: "center", fontFamily: "Funnel Display" }}>
            {storeInitials(name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Funnel Display", fontSize: name.length > 18 ? 64 : 80, lineHeight: 1.02, color: "#1E1F24", letterSpacing: -2 }}>{name}</div>
            {store?.tagline ? <div style={{ marginTop: 18, fontSize: 30, color: "#5B5F6B", lineHeight: 1.3 }}>{store.tagline.slice(0, 80)}</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#1E1F24" }}>
            <div style={{ display: "flex", background: "#1A8D4A", color: "white", borderRadius: 999, padding: "10px 22px" }}>Pide por WhatsApp</div>
            <div style={{ color: "#5B5F6B" }}>{`${host}/${slug}`}</div>
          </div>
        </div>
        {photos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", width: 600, height: 630, gap: 8, padding: 8 }}>
            {photos.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" width={photos.length === 1 ? 584 : 288} height={photos.length <= 2 ? 614 : 303} style={{ objectFit: "cover", borderRadius: 20 }} />
            ))}
          </div>
        )}
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
