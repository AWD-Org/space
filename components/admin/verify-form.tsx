"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { verifyAdminCode } from "@/lib/actions/admin-auth";

export function VerifyForm() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await verifyAdminCode(code);
      if (!res.ok) {
        setError(res.error);
        setCode("");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No pudimos verificar el código. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <Field label="Código" htmlFor="admin-code" error={error || undefined}>
        <Input
          id="admin-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          autoFocus
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy} loadingText="Verificando…" disabled={code.length !== 6}>
        Entrar
      </Button>
    </form>
  );
}
