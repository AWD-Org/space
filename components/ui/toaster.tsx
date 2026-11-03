"use client";

import { Toaster as Sileo } from "sileo";
import "sileo/styles.css";

/** Avisos de Space: arriba y centrados, en blanco como el resto de la app, con indicador de carga cuando algo está en proceso. */
export function Toaster() {
  return (
    <Sileo
      position="top-center"
      offset={{ top: 12 }}
      options={{
        duration: 4500,
        fill: "#FFFFFF",
        roundness: 22,
        styles: { title: "!font-semibold", description: "!text-muted-foreground" },
      }}
    />
  );
}
