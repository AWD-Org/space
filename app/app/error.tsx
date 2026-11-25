"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/site";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Algo salió mal al cargar tu panel</h1>
        <p className="mt-3 text-muted-foreground">Prueba otra vez. Si sigue pasando, escríbenos a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-blueInk underline-offset-4 hover:underline">{SUPPORT_EMAIL}</a>
          {error.digest ? ` con este código: ${error.digest}` : "."}</p>
        <Button className="mt-6" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
