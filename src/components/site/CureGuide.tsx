"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "@/components/shop/useOverlay";
import { usePresence } from "@/components/shop/usePresence";

// Fotos de la comparación: el mismo mate antes y después de curarlo, sacadas
// desde el mismo ángulo para que la línea coincida (public/curado/).
const BEFORE = "/curado/sin-curar.jpg";
const AFTER = "/curado/curado.jpg";

// Cuánto dura la salida de la ventana: igual que .modal.is-closing (overlays.css).
const EXIT_MS = 260;

// Pasos del curado. Los de calabaza los escribió Emanuel (24/10/2026).
const STEPS = {
  calabaza: [
    "Llenalo con agua a temperatura de mate para humedecer la calabaza, y fijate que no filtre.",
    "Tirá el agua y cargalo con yerba nueva o usada, un poco más de la mitad del mate.",
    "Humedecé la yerba con agua a temperatura de mate y asegurate de que se moje toda. Si tiene virola, cebá por debajo de ella.",
    "Dejalo reposar de 12 a 15 horas: una noche.",
    "Al día siguiente sacá la yerba, raspá el hollejo (la pielcita de adentro) y dejalo secar al sol o a la sombra.",
    "¡Listo para usar! Repetí este uso y secado siempre: la calabaza es natural y su sabor mejora con cada cebada y con el tiempo.",
  ],
  algarrobo: [
    "Revisá que esté limpio y seco por dentro.",
    "Untá el interior con aceite o manteca.",
    "Dejalo reposar entre 12 y 24 horas. Si es grande, más tiempo.",
  ],
};

// "Cómo curarlo": en la página es una tarjeta chica con la comparación de
// portada. Al tocarla se abre una ventana con la comparación grande (una línea
// que se arrastra para ver el mate sin curar y curado) y el paso a paso.
// Más adelante va también el video (Emanuel lo sube a YouTube).
export function CureGuide() {
  const [open, setOpen] = useState(false);

  return (
    <section className="wrap block" id="curado" data-reveal>
      <div className="feature feature-cure grain">
        <div className="feature-head">
          <h2>Cómo curarlo</h2>
          <p className="lead">
            Un mate bien curado dura más y ceba mejor. Mirá la diferencia y seguí el paso a paso.
          </p>
          <button className="btn primary" type="button" onClick={() => setOpen(true)}>
            Ver cómo se cura
          </button>
        </div>
        <button className="cure-cover" type="button" onClick={() => setOpen(true)} aria-label="Ver cómo se cura un mate">
          <span className="cure-cover-half">
            <Image src={BEFORE} alt="" fill sizes="(max-width: 820px) 50vw, 240px" />
            <em>Sin curar</em>
          </span>
          <span className="cure-cover-half">
            <Image src={AFTER} alt="" fill sizes="(max-width: 820px) 50vw, 240px" />
            <em>Curado</em>
          </span>
          <span className="cure-cover-hint">Tocá para ver</span>
        </button>
      </div>
      <CureWindow open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function CureWindow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shown, closing } = usePresence(open, EXIT_MS);
  useOverlay(open, onClose);
  if (!shown) return null;

  // va directo al <body>: adentro de la sección quedaría encerrada por la
  // animación de aparecer al bajar (data-reveal), que la recorta
  return createPortal(
    <div
      className={closing ? "modal is-closing" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cure-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card cure-card">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
          ×
        </button>
        <h3 id="cure-title">Cómo curar tu mate</h3>
        <Compare />
        <div className="cure">
          <article>
            <h4>Mate de calabaza</h4>
            <ol>
              {STEPS.calabaza.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article>
            <h4>Mate de algarrobo</h4>
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
    </div>,
    document.body,
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
      <Image src={AFTER} alt="El mate curado: adentro queda oscuro, verde de la yerba" fill sizes="(max-width: 820px) 92vw, 720px" />
      <div className="compare-before">
        <Image src={BEFORE} alt="El mismo mate sin curar: adentro está claro" fill sizes="(max-width: 820px) 92vw, 720px" />
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
    </div>
  );
}
