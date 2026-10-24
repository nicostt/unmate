"use client";

import Image from "next/image";
import { useState } from "react";

// Fotos de la comparación: el mismo mate de calabaza antes y después de
// curarlo, sacadas desde el mismo ángulo para que la línea coincida
// (public/curado/).
const BEFORE = "/curado/sin-curar.jpg";
const AFTER = "/curado/curado.jpg";

// Pasos del curado. Los textos son de Emanuel (24/10/2026): van con sus
// palabras, solo con mayúscula inicial, tildes y puntos. No reescribirlos.
const STEPS = {
  calabaza: [
    "Agua temperatura mate en el interior, preparamos humedeciendo la calabaza y asegurándonos que no filtra.",
    "Retiramos el agua y echamos yerba nueva o usada en poco más de la mitad del mate.",
    "Humedecemos la yerba con agua a temperatura mate y nos aseguramos que toda la yerba se infusione (lo cebamos por debajo de la virola en caso de tener).",
    "Dejamos reposar de 12-15 hs / una noche.",
    "Al día siguiente, retiramos la yerba, raspamos el hollejo y dejamos secar al sol o la sombra.",
    "Tu mate está listo para usarse, se recomienda repetir este proceso de uso y secado toda la vida, la calabaza es un elemento natural que va mejorando su sabor con el paso de las cebadas y el uso en el tiempo.",
  ],
  algarrobo: [
    "Untar el interior del mate con manteca, esto ayuda a sellar los poros de la madera.",
    "2 a 3 horas, se coloca yerba nueva o usada poco más de la mitad y lo cebamos con agua a temperatura mate.",
    "Se deja reposar de 12-14 hs.",
    "Pasadas las horas, retiramos la yerba, limpiamos el mate (podés utilizar un poco de agua y papel de cocina para quitar excedentes de la manteca) y dejamos secar.",
    "Una vez seco, el mate ya está listo para su uso.",
  ],
};

// "Cómo curarlo": a la izquierda el mate de calabaza (con la comparación sin
// curar / curado arriba) y a la derecha el de algarrobo, cada uno con su paso
// a paso. Más adelante va también el video (Emanuel lo sube a YouTube).
export function CureGuide() {
  return (
    <section className="wrap block" id="curado" data-reveal>
      <div className="feature feature-cure grain">
        <div className="feature-head">
          <h2>Cómo curarlo</h2>
          <p className="lead">Un mate bien curado dura más y ceba mejor.</p>
        </div>
        <div className="cure">
          <article>
            <h3>Mate de calabaza</h3>
            <Compare />
            <ol>
              {STEPS.calabaza.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article>
            <h3>Mate de algarrobo</h3>
            <ol>
              {STEPS.algarrobo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
        <p className="note">
          Hay varios métodos y cada artesano tiene el suyo. Los mates de acero no necesitan curado. Para limpiar la
          bombilla, usá agua caliente con bicarbonato y secala sobre un paño.
        </p>
      </div>
    </section>
  );
}

// Las dos fotos encimadas: abajo el mate curado y arriba el sin curar,
// recortado hasta la línea. La línea se mueve con un control deslizante
// invisible que ocupa toda la foto (sirve con el dedo, el mouse y las
// flechas del teclado).
function Compare() {
  const [pos, setPos] = useState(50);

  return (
    <div className="compare" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <Image src={AFTER} alt="El mate curado: adentro queda oscuro, verde de la yerba" fill sizes="(max-width: 820px) 92vw, 420px" />
      <div className="compare-before">
        <Image src={BEFORE} alt="El mismo mate sin curar: adentro está claro" fill sizes="(max-width: 820px) 92vw, 420px" />
      </div>
      <span className="compare-line" aria-hidden="true" />
      <em className="compare-tag is-before">Sin curar</em>
      <em className="compare-tag is-after">Curado</em>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Mover la línea entre el mate sin curar y el curado"
      />
      <span className="compare-hint" aria-hidden="true">
        Deslizá para comparar
      </span>
    </div>
  );
}
