"use client";

import { useEffect, useRef } from "react";

// Hasta dónde se corren las pupilas desde el centro del ojo, en px.
const REACH = 7;

// El "0" del 404: un mate con ojos que siguen al puntero (o al dedo).
// Cada pupila apunta hacia donde está el puntero: el ángulo sale de
// Math.atan2 y con seno y coseno se la corre unos pixeles en esa dirección.
export function LostFace() {
  const face = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function look(e: PointerEvent) {
      for (const pupil of face.current?.querySelectorAll<HTMLElement>(".lost-pupil") ?? []) {
        const eye = pupil.parentElement!.getBoundingClientRect();
        const dx = e.clientX - (eye.left + eye.width / 2);
        const dy = e.clientY - (eye.top + eye.height / 2);
        const angle = Math.atan2(dy, dx);
        const far = Math.min(REACH, Math.hypot(dx, dy) / 18); // de cerca, mira menos de reojo
        pupil.style.transform = `translate(${Math.cos(angle) * far}px, ${Math.sin(angle) * far}px)`;
      }
    }
    window.addEventListener("pointermove", look, { passive: true });
    return () => window.removeEventListener("pointermove", look);
  }, []);

  return (
    <span className="lost-face" ref={face} aria-hidden="true">
      <i className="lost-eye">
        <i className="lost-pupil" />
      </i>
      <i className="lost-eye">
        <i className="lost-pupil" />
      </i>
    </span>
  );
}
