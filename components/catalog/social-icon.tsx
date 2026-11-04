import { Facebook, Instagram, Youtube } from "lucide-react";
import type { SocialKey } from "@/lib/socials";

/** Ícono de cada red. TikTok va en SVG propio porque la librería de íconos no lo trae. */
export function SocialIcon({ name, className }: { name: SocialKey; className?: string }) {
  if (name === "instagram") return <Instagram className={className} aria-hidden />;
  if (name === "facebook") return <Facebook className={className} aria-hidden />;
  if (name === "youtube") return <Youtube className={className} aria-hidden />;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.7 5.7 0 0 0-.77-.05 5.69 5.69 0 1 0 5.69 5.69V8.9a7.35 7.35 0 0 0 4.3 1.38V7.2a4.3 4.3 0 0 1-3.25-1.38z" />
    </svg>
  );
}
