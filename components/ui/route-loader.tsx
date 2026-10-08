import { cn } from "@/lib/utils";

const STARS = [
  { x: "14%", y: "22%", s: 5, d: "0s" },
  { x: "82%", y: "18%", s: 4, d: "0.8s" },
  { x: "70%", y: "78%", s: 6, d: "1.5s" },
  { x: "22%", y: "74%", s: 4, d: "0.4s" },
  { x: "90%", y: "52%", s: 3, d: "1.1s" },
  { x: "8%", y: "50%", s: 3, d: "1.9s" },
  { x: "48%", y: "10%", s: 3, d: "0.2s" },
];

/** Pantalla de carga completa: un pequeño sistema de órbitas con tus «productos» girando alrededor del orbe. */
export function RouteLoader({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn("fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#F4F6FF_0%,#E9ECFF_55%,#DDE2FF_100%)]", className)}
      role="status"
      aria-live="polite"
    >
      {STARS.map((st, i) => (
        <span
          key={i}
          className="orbit-anim absolute rounded-full bg-blueInk"
          style={{ left: st.x, top: st.y, width: st.s, height: st.s, animation: `orbit-twinkle 3s ease-in-out ${st.d} infinite` }}
          aria-hidden
        />
      ))}

      <div className="relative flex flex-col items-center gap-16">
        <div className="orbit-anim relative h-56 w-56 scale-[1.3]" style={{ animation: "orbit-float 4s ease-in-out infinite" }} aria-hidden>
          {/* resplandor */}
          <span className="orbit-anim absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blueInk/30 blur-2xl" style={{ animation: "orbit-glow 3s ease-in-out infinite" }} />
          {/* órbitas */}
          <span className="absolute inset-0 rounded-full border border-blueInk/20" />
          <span className="absolute inset-6 rounded-full border border-dashed border-blueInk/20" />
          {/* satélites */}
          <span className="orbit-anim absolute inset-0" style={{ animation: "orbit-spin 7s linear infinite" }}>
            <span className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2A93B] shadow-[0_0_12px_rgba(242,169,59,0.8)]" />
          </span>
          <span className="orbit-anim absolute inset-6" style={{ animation: "orbit-spin 4.6s linear infinite reverse" }}>
            <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#E04A7B] shadow-[0_0_10px_rgba(224,74,123,0.7)]" />
          </span>
          <span className="orbit-anim absolute inset-14" style={{ animation: "orbit-spin 3s linear infinite" }}>
            <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A8D4A] shadow-[0_0_8px_rgba(26,141,74,0.7)]" />
          </span>
          {/* orbe */}
          <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_28%,#9FB0FF_0%,#5A74F0_38%,#3B55E6_65%,#2A3FB8_100%)] shadow-[0_12px_40px_-6px_rgba(59,85,230,0.65),inset_-8px_-10px_18px_rgba(20,30,110,0.35)]" />
          <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0)_32%)]" />
        </div>
        <p className="text-base font-medium text-ink/70">{label}</p>
      </div>
    </div>
  );
}
