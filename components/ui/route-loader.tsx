import { cn } from "@/lib/utils";

const LAYERS = 45;
const DEPTH = 16; // px a cada lado del centro
const CORE = [44, 66, 188]; // #2C42BC
const FACE = [122, 144, 255]; // #7A90FF

/** Pantalla de carga completa: la estrella de Space en 3D girando sobre su propio eje. */
export function RouteLoader({ label = "Cargando tu espacio", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn("loader-anim fixed inset-0 z-[100] grid place-items-center bg-white", className)}
      style={{ animation: "loader-in 0.4s ease-out both" }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-12">
        <div className="h-28 w-28" style={{ perspective: 700 }} aria-hidden>
          <div className="loader-anim relative h-full w-full" style={{ transformStyle: "preserve-3d", animation: "star-turn 6s linear infinite" }}>
            {Array.from({ length: LAYERS }, (_, i) => {
              const t = (i / (LAYERS - 1)) * 2 - 1; // -1 … 1
              const a = Math.abs(t);
              const c = CORE.map((v, k) => Math.round(v + (FACE[k] - v) * a ** 2.2));
              const color = `rgb(${c[0]},${c[1]},${c[2]})`;
              const scale = 1 - 0.16 * a ** 3;
              return (
                <svg
                  key={i}
                  viewBox="0 0 64 64"
                  className="absolute inset-0 h-full w-full"
                  style={{ transform: `translateZ(${(t * DEPTH).toFixed(2)}px) scale(${scale.toFixed(3)})`, backfaceVisibility: "visible" }}
                >
                  <path d="M32 8l8 16 16 8-16 8-8 16-8-16-16-8 16-8z" fill={color} stroke={color} strokeWidth="0.6" strokeLinejoin="round" />
                </svg>
              );
            })}
          </div>
        </div>
        <p className="text-sm font-medium text-ink/60">{label}</p>
      </div>
    </div>
  );
}
