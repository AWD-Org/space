import Link from "next/link";

export default function PanelNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">No encontramos eso</h1>
      <p className="mt-3 text-muted-foreground">Puede que ya lo hayas borrado o que el link esté incompleto.</p>
      <Link href="/app/productos" className="mt-6 inline-block font-medium text-blueInk underline-offset-4 hover:underline">
        Volver a mis productos
      </Link>
    </div>
  );
}
