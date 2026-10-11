import { CONSULTA_LINK } from "@/lib/site";
import { WhatsAppIcon } from "./BrandIcons";
import { HeroMedia } from "./HeroMedia";
import { RotatingWord } from "./RotatingWord";

// Para qué es el mate: la última palabra del título va rotando entre estas.
const FOR = ["regalar", "la facu", "la oficina", "el finde", "vos"];

// Portada + los tres pasos de "cómo comprar".
// La portada ocupa casi toda la pantalla: de fondo van los videos (o fotos,
// ver src/lib/hero.ts), oscurecidos para que el texto se lea, y el título va
// centrado encima.
export function Hero({ media }: { media: string[] }) {
  return (
    <>
      <section className="hero-video" id="inicio">
        <HeroMedia media={media} />
        <div className="wrap hero-video-copy" data-reveal>
          <p className="eyebrow">Mates · Bombillas · Yerba · Termos</p>
          <h1 aria-label={`Un mate para ${FOR.join(", para ")}`}>
            Un mate para
            <RotatingWord words={FOR} />
          </h1>
          <p className="lead">
            Calabaza y algarrobo, bombillas de acero, alpaca y bronce. Elegí lo que te gusta, armá tu pedido y
            cerralo por WhatsApp.
          </p>
          <div className="cta-row">
            <a className="btn accent" href="#catalogo">
              Ver catálogo
            </a>
            <a className="btn wa" href={CONSULTA_LINK} target="_blank" rel="noopener">
              <WhatsAppIcon />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="wrap steps" aria-label="Cómo comprar" data-reveal>
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
