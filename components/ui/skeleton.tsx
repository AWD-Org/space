import { cn } from "@/lib/utils";

/**
 * Skeleton base de Space: bloque con barrido de brillo (shimmer), como el de HeroUI.
 * Todas las pantallas de carga se arman con este componente y sus variantes.
 */
export function Skeleton({ className, animate = true }: { className?: string; animate?: boolean }) {
  return <div className={cn("skeleton rounded-lg", !animate && "[&::after]:hidden", className)} aria-hidden />;
}

/** Líneas de texto; la última es más corta. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-11 shrink-0 rounded-full", className)} />;
}

export function SkeletonImage({ className, ratio = "aspect-[4/5]" }: { className?: string; ratio?: string }) {
  return <Skeleton className={cn("w-full rounded-[1.375rem]", ratio, className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-32 rounded-full", className)} />;
}

/** Tarjeta de producto del catálogo. */
export function SkeletonProductCard() {
  return (
    <div aria-hidden>
      <SkeletonImage />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-2.5 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/** Fila con miniatura, dos líneas y acción (listas del panel). */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-44 max-w-full" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-9 w-24 rounded-full" />
    </div>
  );
}

export function SkeletonHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <SkeletonButton className="w-36" />}
    </div>
  );
}

export function SkeletonPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl bg-white p-5 ring-1 ring-ink/5 sm:p-6", className)}>{children}</div>;
}

/** Contenedor accesible: avisa «Cargando» a lectores de pantalla. */
export function SkeletonPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando" className={className}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}

/** Esqueleto completo del catálogo público (cabecera, buscador y cuadrícula). */
export function SkeletonCatalog() {
  return (
    <SkeletonPage className="min-h-dvh bg-white">
      <Skeleton className="h-32 w-full rounded-none sm:h-60" />
      <div className="mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-6">
        <div className="-mt-10 flex flex-col gap-3 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
          <Skeleton className="h-20 w-20 shrink-0 rounded-3xl ring-4 ring-white sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1 space-y-3 sm:pb-2">
            <Skeleton className="h-9 w-56 max-w-full sm:h-12" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2 sm:pb-2">
            <SkeletonButton className="h-11 flex-1 sm:w-32 sm:flex-none" />
            <Skeleton className="h-11 w-11 rounded-full" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2">
          {["w-20", "w-24", "w-16", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-9 rounded-full ${w}`} />
          ))}
        </div>
        <SkeletonProductGrid className="mt-6" count={8} />
      </div>
    </SkeletonPage>
  );
}
