"use client";

import { useEffect, useState } from "react";

// Cada cuánto cambia la palabra.
const EVERY_MS = 2400;

// Palabra que va cambiando sola dentro de un título: "Un mate para regalar /
// la facu / vos". Las palabras están apiladas en un hueco que no deja ver lo
// que sobra: la que toca sube desde abajo y la anterior se va por arriba (el
// movimiento es CSS, clase .rw en src/styles/hero.css).
// Quien usa lector de pantalla no la escucha cambiar: el título que la
// contiene lleva el texto completo en aria-label.
export function RotatingWord({ words }: { words: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((i) => (i + 1) % words.length), EVERY_MS);
    return () => clearInterval(timer);
  }, [words.length]);

  const previous = (current - 1 + words.length) % words.length;

  return (
    <span className="rw" aria-hidden="true">
      {words.map((word, i) => (
        <span key={word} className={i === current ? "is-on" : i === previous ? "is-out" : undefined}>
          {word}
        </span>
      ))}
    </span>
  );
}
