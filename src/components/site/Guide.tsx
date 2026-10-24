import { MateTypes } from "./MateTypes";

// Sección de ayuda para elegir. "Cómo curarlo" vive en CureGuide.tsx (sirve
// después de comprar y va más abajo). El orden se decide en src/app/page.tsx.

// Qué tipo de mate conviene. La lista interactiva está en MateTypes.tsx.
export function ChooseGuide() {
  return (
    <section className="wrap block" id="elegir" data-reveal>
      <div className="feature grain">
        <div className="feature-head">
          <h2>¿Cuál es tu tipo de mate?</h2>
          <p className="lead">
            Cada tipo tiene su forma, su material y su manera de tomar. Pasá por los nombres y encontrá el tuyo.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="#catalogo">
              Volver al catálogo
            </a>
            <a className="btn accent" href="#curado">
              ¿Querés saber cómo curarlos? →
            </a>
          </div>
        </div>
        <MateTypes />
      </div>
    </section>
  );
}
