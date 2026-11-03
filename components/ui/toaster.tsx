"use client";

import * as React from "react";
import { Toaster as Sileo } from "sileo";
import "sileo/styles.css";

/**
 * Avisos de Space, en blanco como el resto de la app.
 * Móvil: arriba y centrados, justo debajo de la barra superior (abajo estorbarían a la barra de navegación y al botón Agregar).
 * Escritorio: abajo a la derecha, para no tapar el título ni los botones de cada pantalla.
 */
export function Toaster() {
  const [desktop, setDesktop] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Sileo
      position={desktop ? "bottom-right" : "top-center"}
      offset={desktop ? { bottom: 16, right: 16 } : { top: 60 }}
      options={{
        duration: 4500,
        fill: "#FFFFFF",
        roundness: 22,
        styles: { title: "!font-semibold", description: "!text-muted-foreground" },
      }}
    />
  );
}
