"use client";

import { useEffect } from "react";

/** Manda al servidor los errores no controlados del navegador (máx. 3 por carga). Sin dependencias. */
export function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const send = (message: string, stack?: string) => {
      if (sent >= 3) return;
      sent++;
      const body = JSON.stringify({ message: message.slice(0, 500), stack: stack?.slice(0, 3000), path: location.pathname });
      try {
        if (!navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" }))) {
          void fetch("/api/client-error", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
        }
      } catch {
        /* nunca romper la página por reportar */
      }
    };
    const onError = (e: ErrorEvent) => send(e.message || "Error", e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      send(r?.message || String(r ?? "Rechazo sin motivo"), r?.stack);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
