"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { safe } from "@/lib/client/safe-action";
import { authErrorMessage, changeDisplayName, changePassword, hasPasswordLogin, signOut } from "@/lib/firebase/client";
import { deleteAccount, pauseStore, resumeStore } from "@/lib/actions/account";
import { PAUSE_OPTIONS } from "@/lib/account-options";
import { Panel } from "./shell";

const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" });

export function AccountPanel({ name, email, emailVerified, pausedUntil }: { name: string | null; email: string | null; emailVerified: boolean; pausedUntil: number | null }) {
  const router = useRouter();
  const [nameVal, setNameVal] = React.useState(name ?? "");
  const [savingName, setSavingName] = React.useState(false);
  const [canPassword, setCanPassword] = React.useState(false);
  React.useEffect(() => setCanPassword(hasPasswordLogin()), []);
  const [cur, setCur] = React.useState("");
  const [next, setNext] = React.useState("");
  const [savingPw, setSavingPw] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const v = nameVal.trim();
    if (v.length < 2) return toast.error("Escribe tu nombre.");
    setSavingName(true);
    try {
      await changeDisplayName(v);
      toast.success("Listo, guardamos tu nombre.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("Usa una contraseña de al menos 8 caracteres.");
    setSavingPw(true);
    try {
      await changePassword(cur, next);
      setCur("");
      setNext("");
      toast.success("Cambiaste tu contraseña.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  async function resend() {
    setSending(true);
    try {
      const res = await fetch("/api/verify-email", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) toast.success("Te mandamos el correo. Revisa tu bandeja (y spam).");
      else toast.error(json.error ?? "No pudimos mandar el correo.");
    } catch {
      toast.error("Sin conexión. Revisa tu internet.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:max-w-2xl">
      <Panel title="Tu cuenta">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Correo</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2 font-medium text-ink">
              {email ?? "—"}
              {emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EE] px-2.5 py-0.5 text-xs text-[#146C3B]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Confirmado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3D6] px-2.5 py-0.5 text-xs text-[#7A4B00]">
                  <MailWarning className="h-3.5 w-3.5" aria-hidden /> Sin confirmar
                </span>
              )}
            </dd>
          </div>
        </dl>
        {!emailVerified && (
          <Button variant="soft" size="sm" className="mt-3" onClick={resend} loading={sending}>
            Reenviar correo de confirmación
          </Button>
        )}
        <form onSubmit={saveName} className="mt-6 space-y-3">
          <Field label="Nombre" htmlFor="acc-name">
            <Input id="acc-name" value={nameVal} onChange={(e) => setNameVal(e.target.value)} autoComplete="name" maxLength={60} />
          </Field>
          <Button type="submit" size="sm" loading={savingName}>
            Guardar nombre
          </Button>
        </form>
      </Panel>

      {canPassword && !emailVerified && (
        <Panel title="Contraseña">
          <p className="text-sm text-muted-foreground">Confirma tu correo para poder cambiar tu contraseña. Usa el botón de reenviar de arriba si no te llegó el mensaje.</p>
        </Panel>
      )}
      {canPassword && emailVerified && (
        <Panel title="Contraseña">
          <form onSubmit={savePassword} className="space-y-3">
            <Field label="Contraseña actual" htmlFor="acc-cur">
              <PasswordInput id="acc-cur" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
            </Field>
            <Field label="Contraseña nueva" htmlFor="acc-new" hint="Mínimo 8 caracteres.">
              <PasswordInput id="acc-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <Button type="submit" size="sm" loading={savingPw} disabled={!cur || !next}>
              Cambiar contraseña
            </Button>
          </form>
        </Panel>
      )}

      <Panel title="Sesión">
        <Button variant="secondary" size="sm" onClick={logout}>
          Cerrar sesión
        </Button>
      </Panel>

      <CloseAccount pausedUntil={pausedUntil} />
    </div>
  );
}

/** Cierre de cuenta: primero se ofrece pausar; eliminar queda al final, en dos pasos y con confirmación escrita. */
function CloseAccount({ pausedUntil }: { pausedUntil: number | null }) {
  const router = useRouter();
  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  const [busy, setBusy] = React.useState<number | "resume" | "delete" | null>(null);
  const [phrase, setPhrase] = React.useState("");
  const paused = pausedUntil !== null && pausedUntil > Date.now();

  async function pause(days: number) {
    setBusy(days);
    const res = await safe(() => pauseStore(days));
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Pausamos tu tienda ${days} días. Se reactiva sola.`);
    setStep(0);
    router.refresh();
  }
  async function resume() {
    setBusy("resume");
    const res = await safe(() => resumeStore());
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("Tu tienda volvió a tomar pedidos.");
    router.refresh();
  }
  async function remove() {
    setBusy("delete");
    const res = await safe(() => deleteAccount(phrase));
    if (!res.ok) {
      setBusy(null);
      return toast.error(res.error);
    }
    await signOut();
    window.location.href = "/?cuenta=eliminada";
  }

  if (paused)
    return (
      <Panel title="Tienda en pausa">
        <p className="text-sm text-muted-foreground">Tu catálogo no toma pedidos hasta el {dateFmt.format(new Date(pausedUntil!))}. Después se reactiva sola.</p>
        <Button variant="soft" size="sm" className="mt-3" onClick={resume} loading={busy === "resume"}>
          Reactivar ahora
        </Button>
      </Panel>
    );

  return (
    <div className="pt-10">
      {step === 0 && (
        <button type="button" onClick={() => setStep(1)} className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          ¿Quieres cerrar tu cuenta?
        </button>
      )}
      {step === 1 && (
        <Panel title="¿Necesitas un descanso?">
          <p className="text-sm text-muted-foreground">Mejor pausa tu tienda: tu catálogo, tus productos y tu link se quedan guardados y no toma pedidos mientras tanto. Se reactiva sola cuando termine el tiempo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PAUSE_OPTIONS.map((d) => (
              <Button key={d} variant="soft" size="sm" onClick={() => pause(d)} loading={busy === d}>
                Pausar {d} días
              </Button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/5 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
              Mejor me quedo
            </Button>
            <button type="button" onClick={() => setStep(2)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-ink">
              Prefiero eliminar mi cuenta
            </button>
          </div>
        </Panel>
      )}
      {step === 2 && (
        <Panel title="Eliminar mi cuenta">
          <p className="text-sm text-muted-foreground">
            Se borran para siempre tu tienda, tus productos, categorías, fotos y estadísticas, y tu link queda libre para otras personas. No se puede deshacer.
          </p>
          <div className="mt-4 space-y-3">
            <Field label="Escribe ELIMINAR para confirmar" htmlFor="acc-del">
              <Input id="acc-del" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" autoCapitalize="characters" />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button variant="ink" size="sm" onClick={remove} disabled={phrase.trim().toUpperCase() !== "ELIMINAR"} loading={busy === "delete"}>
                Eliminar para siempre
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Volver
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
