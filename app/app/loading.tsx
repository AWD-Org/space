import { RouteLoader } from "@/components/ui/route-loader";

export default function Loading() {
  // Siempre se ve la estrella mientras se valida la sesión: nunca se muestra una pantalla vacía.
  // Solo la versión en 3D espera un instante para no descargarla en cargas rápidas.
  return <RouteLoader glDelay={0.6} />;
}
