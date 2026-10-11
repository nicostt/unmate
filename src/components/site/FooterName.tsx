"use client";

import { useState } from "react";
import { reducedMotion } from "@/lib/motion";

const NAME = "unmate";
const ENDING = ".es";

// Cuántas hojitas de yerba suelta cada salto.
const SPECKS = 4;

// El nombre de la marca en gigante, al final de la página, con un jueguito:
// cada letra salta cuando se le pasa por arriba (o se la toca) y suelta unas
// hojitas de yerba. Abajo se va contando cuántos "mates" se cebaron.
export function FooterName() {
  const [mates, setMates] = useState(0);

  function jump(letter: HTMLElement) {
    setMates((n) => n + 1);
    if (reducedMotion()) return; // sin saltos: el cambio de color lo hace el CSS

    // Salta el dibujo de la letra (el <b> de adentro) y no su casillero: si se
    // moviera el casillero, se escaparía del puntero y al volver contaría otro
    // salto, y así sin parar.
    const glyph = letter.firstElementChild as HTMLElement;
    glyph.classList.remove("is-jumping");
    void glyph.offsetWidth; // reinicia la animación si ya estaba saltando
    glyph.classList.add("is-jumping");

    for (let i = 0; i < SPECKS; i++) {
      const speck = document.createElement("i");
      speck.className = "end-speck";
      letter.append(speck);
      const side = (Math.random() - 0.5) * 110; // px hacia un costado
      const up = 50 + Math.random() * 60; // px hacia arriba
      const flight = speck.animate(
        [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${side * 0.6}px, ${-up}px)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${side}px, 40px) scale(.4)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 300, easing: "ease-out" },
      );
      flight.onfinish = flight.oncancel = () => speck.remove();
    }
  }

  const letters = (text: string, accent: boolean) =>
    [...text].map((char, i) => (
      <span
        key={`${text}-${i}`}
        className={accent ? "is-accent" : undefined}
        aria-hidden="true"
        onPointerEnter={(e) => jump(e.currentTarget)}
      >
        <b>{char}</b>
      </span>
    ));

  return (
    <div className="end-name-wrap">
      <p className="end-name" aria-label="unmate.es">
        {letters(NAME, false)}
        {letters(ENDING, true)}
      </p>
      <p className="end-game" aria-live="polite">
        {mates === 0
          ? "Pasá por las letras y cebá unos mates"
          : mates < 20
            ? `Llevás ${mates} ${mates === 1 ? "mate cebado" : "mates cebados"}`
            : mates < 50
              ? `${mates} mates cebados. Ya sos cebador oficial.`
              : `${mates} mates. Aflojá, que se lava la yerba.`}
      </p>
    </div>
  );
}
