import { CartButton } from "@/components/shop/CartButton";

export function Header() {
  return (
    <header className="top">
      <div className="wrap bar">
        <a className="brand" href="#inicio" aria-label="unmate.es, inicio">
          <span className="badge" role="img" aria-label="Logo de unmate.es" />
          <span className="brand-name">unmate.es</span>
        </a>
        <nav className="nav" aria-label="Principal">
          <a href="#catalogo">Catálogo</a>
          <a href="#equipo">Armá tu equipo</a>
          <a href="#guia">Guía del mate</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
