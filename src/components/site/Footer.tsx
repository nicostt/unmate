import Image from "next/image";
import { INSTAGRAM_URL } from "@/lib/site";
import { InstagramIcon } from "./BrandIcons";
import { FooterName } from "./FooterName";

// Final de la página: ocupa toda la pantalla, con una foto de fondo
// (ver getEndImage en src/lib/hero.ts), los links de siempre y el nombre de
// la marca en gigante.
export function Footer({ image }: { image: string | null }) {
  return (
    <footer className="end">
      {image && (
        <div className="end-media" aria-hidden="true">
          <Image src={image} alt="" fill sizes="100vw" />
        </div>
      )}
      <div className="wrap end-inner">
        <div className="foot">
          <a className="brand" href="#inicio">
            <span className="badge" role="img" aria-label="Logo de unmate.es" />
            <span className="brand-name">
              unmate<b>.es</b>
            </span>
          </a>
          <nav aria-label="Pie de página">
            <a href="#catalogo">Catálogo</a>
            <a href="#elegir">Elegí tu mate</a>
            <a href="#curado">Cómo curarlo</a>
            <a className="foot-ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
              <InstagramIcon />
              Instagram
            </a>
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
              target="_blank"
              rel="noopener"
            >
              Defensa del consumidor
            </a>
          </nav>
        </div>

        <FooterName />

        <p className="fine">© 2026 unmate.es. Los precios están en pesos argentinos.</p>
      </div>
    </footer>
  );
}
