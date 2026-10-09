import { cn } from "@/lib/utils";

/** Bloque gris que pulsa mientras carga el contenido real. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink/[0.07] motion-reduce:animate-none", className)} aria-hidden />;
}

export function SkeletonHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-11 w-36 rounded-full" />}
    </div>
  );
}

export function SkeletonPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6", className)}>{children}</div>;
}

/** Contenedor accesible: avisa «Cargando» a lectores de pantalla. */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}
