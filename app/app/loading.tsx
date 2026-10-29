import { RouteLoader } from "@/components/ui/route-loader";

export default function Loading() {
  // Si carga en menos de medio segundo no aparece; evita el parpadeo en cada navegación.
  return <RouteLoader delay={0.5} />;
}
