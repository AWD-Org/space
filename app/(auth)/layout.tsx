import Link from "next/link";
import Image from "next/image";
import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { authAvailable } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col bg-white px-5 py-6 sm:px-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2" aria-label="Space, volver al inicio">
          <SpaceLogo variant="mark" size={28} />
          <span className="font-display text-lg font-semibold text-ink">Space</span>
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          {authAvailable ? (
            children
          ) : (
            <div className="max-w-sm">
              <h1 className="font-display text-3xl font-semibold text-ink">Estamos terminando de conectar las cuentas</h1>
              <p className="mt-3 text-muted-foreground">El registro abre en cuanto quede listo. Vuelve en un rato.</p>
            </div>
          )}
        </main>
      </div>
      <div className="relative hidden overflow-hidden bg-spaceMist lg:block" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1764426380608-8a4012e376e4?auto=format&fit=crop&w=1400&q=70"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-10 bottom-10 rounded-3xl bg-white/95 p-6 shadow-xl">
          <p className="font-display text-2xl font-semibold leading-snug text-ink">Lo que vendes, en un link que siempre está al día.</p>
          <p className="mt-2 text-muted-foreground">Tus clientes eligen, tú recibes el pedido armado por WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}
