import { cn } from "@/lib/utils";

/** Marco de teléfono hecho con CSS para mostrar la interfaz real de Space. */
export function PhoneFrame({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <div className={cn("relative mx-auto w-[300px] shrink-0 rounded-[46px] bg-ink p-[10px] shadow-[0_30px_60px_-20px_rgba(30,31,36,0.45)]", className)} role="group" aria-label={label}>
      <div className="relative h-[600px] overflow-hidden rounded-[37px] bg-white">
        <div className="absolute left-1/2 top-2.5 z-30 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-ink" aria-hidden />
        {children}
      </div>
    </div>
  );
}
