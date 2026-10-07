import Link from "next/link";

export function NotConfigured() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">El panel abre muy pronto</h1>
        <p className="mt-3 text-muted-foreground">Estamos terminando de conectar Space con su base de datos. Tus datos no se pierden; vuelve en un rato.</p>
        <Link href="/" className="mt-6 inline-block font-medium text-blueInk underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
