"use client";

import { useEffect } from "react";

// A partir de cuánto scroll (px) el encabezado puede esconderse: cerca del
// principio de la página se queda siempre.
const START = 160;
// Movimientos más chicos que esto no cuentan (px): evita que tiemble.
const MIN_MOVE = 6;

// Encabezado que se esconde y vuelve: al bajar, la barra de arriba se va
// para dejarle lugar al contenido; apenas se sube un poco, vuelve. No dibuja
// nada: le pone o le saca la clase "is-away" al encabezado (.top), y el
// movimiento es CSS (src/styles/header.css).
export function HideOnScroll() {
  useEffect(() => {
    const header = document.querySelector(".top");
    if (!header) return;
    let last = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      if (Math.abs(y - last) < MIN_MOVE) return;
      header!.classList.toggle("is-away", y > last && y > START);
      last = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
