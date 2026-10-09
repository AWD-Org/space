"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { RouteLoader } from "@/components/ui/route-loader";
import { authFormSchema, type AuthFormValues } from "@/lib/validators";
import { authErrorMessage, localModeAuth, resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/client";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1a11 11 0 0 0 0 9.8L5.8 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1L5.8 10C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<"email" | "google" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [redirecting, setRedirecting] = React.useState(false);
  const signup = mode === "signup";
  const schema = React.useMemo(() => authFormSchema(signup, localModeAuth), [signup]);
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { name: "", email: "", password: "" } });
  const destination = next && next.startsWith("/app") ? next : "/app";

  async function finish(fn: () => Promise<void>, kind: "email" | "google") {
    setError(null);
    setPending(kind);
    try {
      await fn();
      setRedirecting(true);
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(null);
    }
  }

  const submit = handleSubmit(
    (v) => void finish(() => (signup ? signUpWithEmail(v.name, v.email, v.password) : signInWithEmail(v.email, v.password)), "email"),
    () => setError(null)
  );

  async function forgot() {
    setError(null);
    if (!(await trigger("email"))) return;
    try {
      await resetPassword(getValues("email").trim());
      toast.success("Te mandamos un correo para crear una contraseña nueva.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <div className="w-full max-w-sm">
      {redirecting && (
        <RouteLoader />
      )}
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{signup ? "Crea tu espacio" : "Qué bueno verte"}</h1>
      <p className="mt-2 text-muted-foreground">{signup ? "Es gratis y no pide tarjeta." : "Entra a tu espacio para actualizar tus productos."}</p>

      {localModeAuth && (
        <p className="mt-4 rounded-xl bg-spaceMist p-3 text-sm text-blueInk">Modo local de pruebas: cualquier correo entra sin contraseña.</p>
      )}

      <Button type="button" variant="secondary" size="lg" className="mt-8 w-full" disabled={pending !== null} onClick={() => finish(signInWithGoogle, "google")}>
        <GoogleGlyph />
        {pending === "google" ? "Conectando…" : "Continuar con Google"}
      </Button>

      <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {signup && (
          <Field label="Tu nombre" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="Como te dicen" />
          </Field>
        )}
        <Field label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" {...register("email")} aria-invalid={!!errors.email} autoComplete="email" />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={errors.password?.message} hint={signup ? "Mínimo 8 caracteres." : undefined}>
          <Input id="password" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" {...register("password")} aria-invalid={!!errors.password} autoComplete={signup ? "new-password" : "current-password"} />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
          {pending === "email" ? "Un momento…" : signup ? "Crear mi cuenta" : "Entrar"}
        </Button>
      </form>

      {!signup && (
        <button type="button" onClick={forgot} className="mt-4 text-sm text-blueInk underline-offset-4 hover:underline">
          Olvidé mi contraseña
        </button>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        {signup ? "¿Ya tienes cuenta? " : "¿Todavía no tienes catálogo? "}
        <Link href={signup ? "/entrar" : "/registro"} className="font-medium text-blueInk underline-offset-4 hover:underline">
          {signup ? "Entra aquí" : "Créalo gratis"}
        </Link>
      </p>
    </div>
  );
}
