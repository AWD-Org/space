import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Crea tu catálogo gratis",
  description: "Abre tu cuenta de Space con Google o con tu correo y arma tu catálogo desde el celular.",
  alternates: { canonical: "/registro" },
};

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/app");
  return <AuthForm mode="signup" />;
}
