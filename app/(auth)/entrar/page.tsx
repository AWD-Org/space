import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar", robots: { index: false }, alternates: { canonical: "/entrar" } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/app");
  const { next } = await searchParams;
  return <AuthForm mode="signin" next={next} />;
}
