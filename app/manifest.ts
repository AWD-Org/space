import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Space",
    short_name: "Space",
    description: "Tu catálogo digital con pedidos por WhatsApp.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F4F5F8",
    theme_color: "#F4F5F8",
    lang: "es-MX",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
