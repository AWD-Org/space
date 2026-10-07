import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl font-semibold text-ink">Este link no lleva a ningún catálogo</h1>
        <p className="mt-3 text-muted-foreground">Puede que la tienda haya cambiado su link o que todavía no lo publique.</p>
        <Link href="/" className="mt-6 inline-block font-medium text-blueInk underline-offset-4 hover:underline">
          Conoce Space
        </Link>
      </div>
    </main>
  );
}
