// Guía del mate: cómo elegir y cómo curar. Es texto fijo; se edita acá.
export function Guide() {
  return (
    <section className="wrap block" id="guia">
      <div className="guide">
        <div>
          <p className="eyebrow">Guía del mate</p>
          <h2>Cómo elegir el tuyo</h2>
          <dl className="def">
            <div>
              <dt>Camionero</dt>
              <dd>De forma robusta y práctica, pensado para el uso de todos los días y para llevar.</dd>
            </div>
            <div>
              <dt>Torpedo</dt>
              <dd>De forma alargada y más angosta hacia la base.</dd>
            </div>
            <div>
              <dt>Calabaza</dt>
              <dd>Material natural. Antes de usarlo hay que curarlo.</dd>
            </div>
            <div>
              <dt>Algarrobo</dt>
              <dd>Madera. También se cura antes del primer mate.</dd>
            </div>
            <div>
              <dt>Bombillón</dt>
              <dd>Versión más grande de la bombilla, para acompañar mates de más volumen.</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="eyebrow">Antes del primer mate</p>
          <h2>Cómo curarlo</h2>
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
            Hay varios métodos y cada artesano tiene el suyo. Los mates de acero no necesitan curado. Para limpiar
            la bombilla, usá agua caliente con bicarbonato y secala sobre un paño.
          </p>
        </div>
      </div>
    </section>
  );
}
