import { MateTypes } from "./MateTypes";

// Las dos secciones de ayuda de la tienda. Van separadas porque sirven en
// momentos distintos: los tipos de mate ayudan a decidir (van justo después
// del catálogo) y "Cómo curarlo" sirve después de comprar (más abajo). El orden se decide en src/app/page.tsx.

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

// Cómo curar el mate antes de usarlo. Es texto fijo; se edita acá.
// PENDIENTE: sumar los videos de curado cuando Nicolás los suba a YouTube.
export function CureGuide() {
  return (
    <section className="wrap block" id="curado" data-reveal>
      <div className="feature feature-cure grain">
        <div className="feature-head">
          <h2>Cómo curarlo</h2>
          <p className="lead">
            Un mate bien curado dura más y ceba mejor. Son tres pasos y un poco de paciencia.
          </p>
        </div>
        <div className="cure">
          <article>
            <h3>Mate de calabaza</h3>
            <ol>
              <li>Con el mate limpio, llenalo con yerba usada y agua caliente.</li>
              <li>Dejalo reposar unas 12 horas.</li>
              <li>Raspá el interior con una cuchara para sacar la membrana, enjuagá y dejá secar.</li>
            </ol>
          </article>
          <article>
            <h3>Mate de algarrobo</h3>
            <ol>
              <li>Revisá que esté limpio y seco por dentro.</li>
              <li>Untá el interior con aceite o manteca.</li>
              <li>Dejalo reposar entre 12 y 24 horas. Si es grande, más tiempo.</li>
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
