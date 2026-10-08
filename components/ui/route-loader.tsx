import { SpaceLogo } from "@/src/brand/space/SpaceLogo";
import { cn } from "@/lib/utils";

/** Pantalla de carga mientras el servidor revisa la sesión o prepara la página. */
export function RouteLoader({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("grid place-items-center", className)} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid h-20 w-20 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blueInk/10 [animation-duration:1.8s] motion-reduce:animate-none" aria-hidden />
          <span className="absolute inset-0 rounded-full border-2 border-blueInk/15" aria-hidden />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blueInk [animation-duration:1.1s] motion-reduce:animate-none" aria-hidden />
          <SpaceLogo variant="mark" size={32} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
