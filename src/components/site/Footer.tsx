import { INSTAGRAM_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <a className="brand" href="#inicio">
          <span className="badge" role="img" aria-label="Logo de unmate.es" />
          <span className="brand-name">unmate.es</span>
        </a>
        <nav aria-label="Pie de página">
          <a href="#catalogo">Catálogo</a>
          <a href="#guia">Guía del mate</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener">
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
