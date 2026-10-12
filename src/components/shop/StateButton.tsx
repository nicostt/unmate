"use client";

import { useEffect, useRef, useState } from "react";

// Cuánto se ve cada momento, en milisegundos.
const WORKING_MS = 350; // el circulito girando
const DONE_MS = 1100; // el tilde de "listo"

// "Botón que cuenta lo que pasa": al tocarlo no queda igual, sino que muestra
// un circulito girando y enseguida un tilde con el resultado ("Sumado"), y
// después vuelve a su texto. Así se ve que el toque sirvió, sin depender de
// otro cartel.
//  - `onAct` hace el trabajo y devuelve si salió bien;
//  - `onDone` corre después de mostrar el tilde (por ejemplo, abrir el carrito).
// El cambio entre los tres estados es CSS (clase .state en src/styles/controls.css).
export function StateButton({
  children,
  done,
  className,
  disabled,
  onAct,
  onDone,
}: {
  children: React.ReactNode; // el texto de siempre
  done: string; // el texto del tilde
  className: string;
  disabled?: boolean;
  onAct: () => boolean;
  onDone?: () => void;
}) {
  const [state, setState] = useState<"idle" | "load" | "ok">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // si el botón desaparece a mitad de camino, no queda nada pendiente
  useEffect(() => () => clearTimeout(timer.current), []);

  function click() {
    if (state !== "idle") return; // ya está en eso
    setState("load");
    timer.current = setTimeout(() => {
      if (!onAct()) return setState("idle"); // no se pudo (sin stock): vuelve como estaba
      setState("ok");
      timer.current = setTimeout(() => {
        setState("idle");
        onDone?.();
      }, DONE_MS);
    }, WORKING_MS);
  }

  return (
    <button className={`${className} state`} type="button" data-state={state} disabled={disabled} onClick={click}>
      <span className="s-idle">{children}</span>
      <span className="s-load" aria-hidden="true">
        <i />
      </span>
      <span className="s-ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        {done}
      </span>
      {/* para lectores de pantalla: se anuncia el resultado */}
      <span className="sr" role="status">
        {state === "ok" ? done : ""}
      </span>
    </button>
  );
}
