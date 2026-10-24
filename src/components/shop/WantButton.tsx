"use client";

import { useSyncExternalStore } from "react";
import { track } from "@/lib/track";

// Productos que esta persona ya pidió (guardado en su navegador), para que el
// botón siga diciendo "¡Anotado!" si vuelve a entrar.
const WANTED_KEY = "unmate-quiero";
const CHANGED = "unmate-quiero-cambio"; // aviso entre botones del mismo producto (tarjeta y ficha)

function wantedList(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WANTED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange); // otra pestaña
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Botón de un producto agotado: "Agotado · Lo quiero". Al tocarlo se anota en
// las estadísticas que alguien lo quería (evento 'want', anónimo; la base lo
// cuenta una vez por persona) y el botón queda con un tilde: "¡Anotado!".
// Sirve para saber qué reponer. No pide datos, así que no se le puede avisar
// a la persona cuando vuelva.
// Usa las mismas clases que StateButton (.state, src/styles/controls.css) para
// el cambio de texto con animación.
export function WantButton({ slug, small }: { slug: string; small?: boolean }) {
  // en el servidor (y en el primer dibujo) no se sabe qué pidió cada uno: false
  const done = useSyncExternalStore(
    subscribe,
    () => wantedList().includes(slug),
    () => false,
  );

  function want() {
    if (done) return;
    track("want", { slug });
    try {
      localStorage.setItem(WANTED_KEY, JSON.stringify([...wantedList(), slug].slice(-100)));
    } catch {}
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <button
      type="button"
      className={`btn ghost want state${small ? " small" : ""}`}
      data-state={done ? "ok" : "idle"}
      onClick={want}
      title={done ? "Ya lo anotamos: nos sirve para saber qué reponer" : "Tocá para avisarnos que lo querés"}
    >
      <span className="s-idle">Agotado · Lo quiero</span>
      <span className="s-ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        ¡Anotado!
      </span>
      <span className="sr" role="status">
        {done ? "Anotado: nos sirve para saber qué reponer" : ""}
      </span>
    </button>
  );
}
