import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const display = localFont({
  src: "../node_modules/@fontsource-variable/funnel-display/files/funnel-display-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "300 800",
  display: "swap",
});

const text = localFont({
  src: "../node_modules/@fontsource-variable/funnel-sans/files/funnel-sans-latin-wght-normal.woff2",
  variable: "--font-text",
  weight: "300 800",
  display: "swap",
});

const title = "Space · Catálogo digital gratis para vender por WhatsApp";
const description =
  "Sube lo que vendes desde tu celular, comparte un link y recibe pedidos armados por WhatsApp. Gratis y sin comisiones, para estudiantes y emprendedores.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · Space" },
  description,
  applicationName: "Space",
  alternates: { canonical: "/", languages: { "es-MX": "/" } },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Space",
    locale: "es_MX",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/favicon.svg" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#F4F5F8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${text.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
