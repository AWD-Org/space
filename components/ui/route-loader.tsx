import { cn } from "@/lib/utils";

const STARS = [
  { x: "16%", y: "24%", s: 2 },
  { x: "81%", y: "20%", s: 2 },
  { x: "72%", y: "76%", s: 3 },
  { x: "24%", y: "72%", s: 2 },
  { x: "91%", y: "50%", s: 2 },
  { x: "9%", y: "48%", s: 2 },
];

/** Pantalla de carga completa: un orbe sereno con una órbita fina y un solo satélite. */
export function RouteLoader({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn("orbit-anim fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#FFFFFF_0%,#F4F6FF_60%,#E9ECFF_100%)]", className)}
      style={{ animation: "orbit-in 0.5s ease-out both" }}
      role="status"
      aria-live="polite"
    >
      {STARS.map((st, i) => (
        <span key={i} className="absolute rounded-full bg-blueInk/25" style={{ left: st.x, top: st.y, width: st.s, height: st.s }} aria-hidden />
      ))}

      <div className="flex flex-col items-center gap-14">
        <div className="relative h-60 w-60" aria-hidden>
          <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blueInk/20 blur-3xl" />
          <span className="absolute inset-0 rounded-full border border-blueInk/15" />
          <span className="absolute inset-10 rounded-full border border-blueInk/10" />
          <span className="orbit-anim absolute inset-0" style={{ animation: "orbit-spin 18s linear infinite" }}>
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blueInk" />
          </span>
          <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#8EA0F7_0%,#4A64EA_42%,#3B55E6_68%,#2C42BC_100%)] shadow-[0_16px_40px_-10px_rgba(59,85,230,0.55),inset_-8px_-10px_16px_rgba(20,30,110,0.28)]" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink/50">{label}</p>
      </div>
    </div>
  );
}
