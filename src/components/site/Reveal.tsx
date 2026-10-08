"use client";

import { useEffect } from "react";

// Efecto de "aparecer al bajar": cada elemento marcado con el atributo
// data-reveal arranca invisible y un poco más abajo, y cuando entra en la
// pantalla sube a su lugar y se queda. Pasa una sola vez por elemento.
//
// Cómo se arma:
//  - un script mínimo (src/lib/theme.ts) le pone la clase "reveal" a <html>
//    antes de pintar la página; sin esa clase nada se oculta, así que si el
//    JavaScript fallara el contenido se ve igual;
//  - el CSS (globals.css) oculta los [data-reveal] que no tengan "is-in";
//  - este componente revisa, al cargar y cada vez que se mueve la página,
//    cuáles ya asoman en pantalla y les pone "is-in".
//
// Para sumar el efecto a algo nuevo alcanza con agregarle data-reveal.
// El catálogo no lo tiene a propósito: los productos se ven de entrada.
export function Reveal() {
  useEffect(() => {
    let pending = [...document.querySelectorAll("[data-reveal]:not(.is-in)")];

    function check() {
      // aparece cuando su borde de arriba pasa el 88 % del alto de la pantalla
      const line = window.innerHeight * 0.88;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > line) return true;
        el.classList.add("is-in");
        return false;
      });
      if (pending.length === 0) stop();
    }

    function stop() {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return stop;
  }, []);

  return null;
}
