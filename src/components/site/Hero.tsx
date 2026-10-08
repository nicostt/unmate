import { CONSULTA_LINK } from "@/lib/site";

// Portada + los tres pasos de "cómo comprar".
export function Hero() {
  return (
    <>
      <section className="wrap hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Mates · Bombillas · Termos</p>
          <h1>Todo para tu mate de cada día.</h1>
          <p className="lead">
            Calabaza y algarrobo, bombillas de acero, alpaca y bronce. Elegí lo que te gusta, armá tu pedido y
            cerralo por WhatsApp.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="#catalogo">
              Ver catálogo
            </a>
            <a className="btn ghost" href={CONSULTA_LINK} target="_blank" rel="noopener">
              Consultar por WhatsApp
            </a>
          </div>
        </div>
        <div className="hero-art">
          <div className="ring" />
          <div
            className="logo-card"
            role="img"
            aria-label="Logo de unmate.es: un mate con bombilla dentro de un arco"
          />
        </div>
      </section>

      <section className="wrap steps" aria-label="Cómo comprar">
        <ol>
          <li tabIndex={0}>
            <strong>Elegí tus productos</strong>
            <span>Mirá el catálogo con precios claros y sumá lo que quieras.</span>
          </li>
          <li tabIndex={0}>
            <strong>Armá tu carrito</strong>
            <span>Ajustá cantidades y revisá el total antes de pedir.</span>
          </li>
          <li tabIndex={0}>
            <strong>Mandá el pedido por WhatsApp</strong>
            <span>Se abre el chat con todo escrito. Coordinamos envío y pago ahí.</span>
          </li>
        </ol>
      </section>
    </>
  );
}
