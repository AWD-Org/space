import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin de Space" }, robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
