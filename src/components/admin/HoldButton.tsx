"use client";

import { useEffect, useRef, useState } from "react";

// Cuánto hay que mantener apretado, en milisegundos. El relleno del botón
// (clase .hold en src/styles/admin.css) dura lo mismo.
const HOLD_MS = 1100;

// Botón para acciones que no se pueden deshacer (borrar un producto, una
// foto, un pedido). En vez de preguntar "¿Estás seguro?" en una ventana,
// hay que MANTENERLO APRETADO un segundo: el botón se va llenando de color y,
// si se suelta antes, no pasa nada. Evita borrar algo por un clic de más.
// También anda con el teclado: mantener Espacio o Enter.
export function HoldButton({
  children,
  onConfirm,
  disabled,
  className = "btn ghost small danger",
  title,
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  title?: string; // qué va a pasar, para quien deja el mouse encima
}) {
  const [state, setState] = useState<"idle" | "holding" | "hint">("idle");
  const timers = useRef<{ hold?: ReturnType<typeof setTimeout>; hint?: ReturnType<typeof setTimeout> }>({});

  // si el botón desaparece a mitad de camino, no queda nada pendiente
  useEffect(() => {
    const pending = timers.current;
    return () => {
      clearTimeout(pending.hold);
      clearTimeout(pending.hint);
    };
  }, []);

  function start() {
    if (disabled || state === "holding") return;
    clearTimeout(timers.current.hint);
    setState("holding");
    timers.current.hold = setTimeout(() => {
      setState("idle");
      onConfirm();
    }, HOLD_MS);
  }

  // Soltó antes de tiempo: no se hace nada, y el botón avisa cómo se usa.
  function cancel() {
    if (state !== "holding") return;
    clearTimeout(timers.current.hold);
    setState("hint");
    timers.current.hint = setTimeout(() => setState("idle"), 1800);
  }

  const label = state === "hint" ? "Mantené apretado" : children;

  return (
    <button
      type="button"
      className={`${className} hold${state === "holding" ? " is-holding" : ""}${state === "hint" ? " is-hint" : ""}`}
      disabled={disabled}
      title={title ?? "Mantené apretado un segundo para confirmar"}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && start()}
      onKeyUp={cancel}
      onBlur={cancel}
      onContextMenu={(e) => e.preventDefault()} // en el celular, mantener apretado abre un menú
    >
      {label}
      {/* la misma etiqueta, en colores invertidos, que se va destapando de izquierda a derecha */}
      <span className="hold-fill" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
