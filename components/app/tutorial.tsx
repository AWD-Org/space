"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markTutorialSeen, restartTutorial } from "@/lib/actions/tutorial";
import type { TutorialId } from "@/lib/tutorial";

interface Ctx {
  enabled: boolean;
  isPending: (id: TutorialId) => boolean;
  markSeen: (id: TutorialId) => void;
  /** Borra lo visto y activa el tutorial, aunque la cuenta sea anterior a él. */
  restart: () => void;
}

const TutorialContext = React.createContext<Ctx>({ enabled: false, isPending: () => false, markSeen: () => {}, restart: () => {} });

/** El estado viene de la cuenta (Firestore); aquí solo se refleja al instante lo que la persona va cerrando. */
export function TutorialProvider({ enabled, seen, children }: { enabled: boolean; seen: TutorialId[]; children: React.ReactNode }) {
  const key = seen.join(",");
  const [forced, setForced] = React.useState(false);
  const [local, setLocal] = React.useState<TutorialId[]>(seen);
  React.useEffect(() => setLocal(key ? (key.split(",") as TutorialId[]) : []), [key, enabled]);

  const markSeen = React.useCallback((id: TutorialId) => {
    setLocal((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Si falla el guardado no se bloquea nada: lo peor es que vuelva a salir una vez.
    void markTutorialSeen(id).catch(() => {});
  }, []);

  const restart = React.useCallback(() => {
    setForced(true);
    setLocal([]);
    // Sin router.refresh(): el estado local ya está al día y una recarga tardía podría pisar lo que la persona cierre enseguida.
    void restartTutorial().catch(() => {});
  }, []);

  const on = enabled || forced;
  const value = React.useMemo<Ctx>(() => ({ enabled: on, isPending: (id) => on && !local.includes(id), markSeen, restart }), [on, local, markSeen, restart]);
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  return React.useContext(TutorialContext);
}

/** Botón de ícono con tooltip para volver a ver el recorrido. Vive en Inicio. */
export function TutorialButton() {
  const { restart } = useTutorial();
  const reduce = useReducedMotion();
  return (
    <div className="group relative">
      <motion.button
        type="button"
        onClick={restart}
        aria-label="Ver el tutorial"
        whileHover={reduce ? undefined : { scale: 1.08, rotate: -8 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-blueInk ring-1 ring-ink/10 transition-colors hover:bg-spaceMist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CircleHelp className="h-5 w-5" aria-hidden />
      </motion.button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Ver el tutorial
      </span>
    </div>
  );
}

/** Tarjeta de ayuda de una pantalla. Entra con suavidad y se pliega al cerrarse. */
export function HelpCard({ id, title, children }: { id: TutorialId; title: string; children: React.ReactNode }) {
  const { isPending, markSeen } = useTutorial();
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <AnimatePresence initial>
      {isPending(id) && (
        <motion.div
          key={id}
          initial={reduce ? false : { opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto", transition: { ...t, delay: reduce ? 0 : 0.25 } }}
          exit={{ opacity: 0, y: -6, height: 0, transition: reduce ? { duration: 0 } : { duration: 0.28, ease: "easeInOut" } }}
          className="overflow-hidden"
        >
          <aside aria-label="Ayuda" className="mb-5 flex items-start gap-3 rounded-2xl bg-spaceMist/70 p-4 ring-1 ring-blueInk/10">
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-ink/75">{children}</p>
              <button type="button" onClick={() => markSeen(id)} className="mt-2 text-sm font-medium text-blueInk underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Entendido
              </button>
            </div>
            <button
              type="button"
              onClick={() => markSeen(id)}
              aria-label="Cerrar ayuda"
              className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-white/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const STEPS: { target?: string; title: string; text: string }[] = [
  { target: "productos", title: "Tus productos", text: "Aquí agregas productos, cambias su orden y los ocultas sin borrarlos." },
  { target: "tienda", title: "Tu tienda", text: "Cambia tu nombre, logo y color, y el WhatsApp al que llegan los pedidos." },
  { target: "compartir", title: "Tu link y tu QR", text: "Mándalos por WhatsApp o imprímelos. En el celular los encuentras en Inicio." },
  { target: "catalogo", title: "Así lo ve la gente", text: "Abre tu catálogo cuando cambies algo para revisar cómo se ve." },
];

type Box = { top: number; left: number; width: number; height: number };

function findVisible(target?: string): HTMLElement | null {
  if (!target) return null;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  return nodes.find((n) => n.getClientRects().length > 0 && n.getBoundingClientRect().width > 0) ?? null;
}

function place(box: Box | null, vp: { w: number; h: number }, width: number, popH: number) {
  const clampX = (x: number) => Math.max(16, Math.min(x, vp.w - width - 16));
  if (!box) return { top: Math.max(16, (vp.h - popH) / 2), left: (vp.w - width) / 2 };
  // Menú lateral en escritorio: el mensaje sale a la derecha.
  if (vp.w >= 1024 && box.left < 300) return { top: Math.max(16, Math.min(box.top - 8, vp.h - popH - 16)), left: box.left + box.width + 16 };
  const left = clampX(box.left + box.width / 2 - width / 2);
  if (box.top > vp.h / 2) return { top: Math.max(16, box.top - 16 - popH), left };
  return { top: box.top + box.height + 16, left };
}

const SPRING = { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } as const;

/** Recorrido de bienvenida: se ve una vez, en Inicio, y se puede omitir en cualquier paso. */
export function WelcomeTour() {
  const { isPending, markSeen } = useTutorial();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [step, setStep] = React.useState(0);
  const [box, setBox] = React.useState<Box | null>(null);
  const [vp, setVp] = React.useState({ w: 0, h: 0 });
  const [popH, setPopH] = React.useState(190);
  const next = React.useRef<HTMLButtonElement>(null);
  const pop = React.useRef<HTMLDivElement>(null);
  const open = pathname === "/app" && isPending("panel");
  const current = STEPS[step];

  const measure = React.useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const el = findVisible(STEPS[step].target);
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Se mide antes de pintar para que el resaltado nunca se quede un instante en el paso anterior.
  React.useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Altura real del mensaje, para colocarlo bien arriba o abajo del elemento resaltado.
  React.useLayoutEffect(() => {
    if (!open || !pop.current) return;
    const el = pop.current;
    const update = () => setPopH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, vp.w]);

  React.useEffect(() => {
    if (open) next.current?.focus();
  }, [open, step]);

  const finish = React.useCallback(() => markSeen("panel"), [markSeen]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  const show = open && vp.w > 0;
  const last = step === STEPS.length - 1;
  const width = Math.min(340, vp.w - 32);
  const pad = 6;
  const pos = place(box, vp, width, popH);
  // Sin elemento que resaltar, el resaltado se encoge al centro y solo queda el fondo oscuro.
  const spot = box
    ? { top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2, ring: 1 }
    : { top: vp.h / 2, left: vp.w / 2, width: 0, height: 0, ring: 0 };
  const move = reduce ? { duration: 0 } : SPRING;
  const fade = reduce ? { duration: 0 } : { duration: 0.28, ease: "easeOut" as const };

  return (
    // Al terminar de salir, el recorrido vuelve al primer paso para la próxima vez.
    <AnimatePresence onExitComplete={() => setStep(0)}>
      {show && (
        <motion.div key="tour" className="fixed inset-0 z-[90]" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
          {/* Bloquea los clics de abajo mientras dura el recorrido. */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.58)]"
            initial={false}
            animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
            transition={move}
          >
            <motion.div className="absolute inset-0 rounded-xl ring-2 ring-white/90" animate={{ opacity: spot.ring }} transition={fade} />
            {!reduce && box && (
              <motion.div
                key={step}
                className="absolute inset-0 rounded-xl ring-2 ring-white"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.18 }}
                transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity, repeatDelay: 0.3 }}
              />
            )}
          </motion.div>
          <motion.div
            ref={pop}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            className="absolute rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-ink/10"
            style={{ width }}
            initial={{ opacity: 0, scale: 0.94, y: 12, top: pos.top, left: pos.left }}
            animate={{ opacity: 1, scale: 1, y: 0, top: pos.top, left: pos.left }}
            exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: reduce ? 0 : 0.2, ease: "easeIn" } }}
            transition={{ ...move, opacity: fade, scale: { type: "spring", stiffness: 300, damping: 24 } }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -14 }}
                transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
              >
                <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
                  {step + 1} de {STEPS.length}
                </p>
                <h2 id="tour-title" className="mt-1 font-display text-lg font-semibold text-ink">
                  {current.title}
                </h2>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/75">{current.text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" onClick={finish} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-cloud hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Omitir
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1" aria-hidden>
                  {STEPS.map((_, i) => (
                    <motion.span key={i} className="h-1.5 rounded-full" initial={false} animate={{ width: i === step ? 18 : 6, backgroundColor: i <= step ? "#3B55E6" : "rgba(15,23,42,0.15)" }} transition={move} />
                  ))}
                </div>
                <Button ref={next} size="sm" onClick={() => (last ? finish() : setStep((n) => n + 1))}>
                  {last ? "Listo" : "Siguiente"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
