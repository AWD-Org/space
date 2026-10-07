import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/fonts";
import { formatPrice } from "@/lib/format";
import { loadCatalog } from "../../data";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Producto en Space";

export default async function Image({ params }: { params: Promise<{ slug: string; product: string }> }) {
  const { slug, product } = await params;
  const result = await loadCatalog(slug);
  const store = result?.catalog.store;
  const p = result?.catalog.products.find((x) => x.slug === product);
  const photo = p?.images[0]?.url;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4F5F8", fontFamily: "Funnel Sans" }}>
        {photo?.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={504} height={630} style={{ objectFit: "cover" }} />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: 64 }}>
          <div style={{ fontSize: 28, color: "#5B5F6B" }}>{store?.name ?? "Space"}</div>
          <div style={{ marginTop: 12, fontFamily: "Funnel Display", fontSize: 72, lineHeight: 1.04, color: "#1E1F24", letterSpacing: -2 }}>{p?.name ?? "Producto"}</div>
          <div style={{ marginTop: 20, fontFamily: "Funnel Display", fontSize: 48, color: store?.accent ?? "#3B55E6" }}>{formatPrice(p?.price ?? null, p?.priceFrom)}</div>
          <div style={{ display: "flex", marginTop: 40 }}>
            <div style={{ display: "flex", background: "#1A8D4A", color: "white", borderRadius: 999, padding: "12px 26px", fontSize: 26 }}>Agrégalo a tu pedido</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
