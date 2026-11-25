import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBaseAdmin, getVerifiedAdmin } from "@/lib/admin";
import { VerifyForm } from "@/components/admin/verify-form";

export const metadata: Metadata = { title: "Verificación" };

export default async function VerifyPage() {
  if (await getVerifiedAdmin()) redirect("/admin");
  if (!(await getBaseAdmin())) notFound();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Verificación en dos pasos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Escribe el código de 6 dígitos de tu app de autenticación.</p>
      <VerifyForm />
    </main>
  );
}
