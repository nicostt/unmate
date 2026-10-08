import { INSTAGRAM_URL } from "@/lib/site";
import { InstagramIcon } from "./BrandIcons";

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
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
        <p className="fine">© 2026 unmate.es. Los precios están en pesos argentinos.</p>
      </div>
    </footer>
  );
}
