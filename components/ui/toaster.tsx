"use client";

import { Toaster as Sileo } from "sileo";
import "sileo/styles.css";

/** Avisos de Space: arriba y centrados, con indicador de carga cuando algo está en proceso. */
export function Toaster() {
  return <Sileo position="top-center" offset={{ top: 12 }} theme="light" options={{ duration: 4500 }} />;
}
