import { CartButton } from "@/components/shop/CartButton";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="top">
      <div className="wrap bar">
        <a className="brand" href="#inicio" aria-label="unmate.es, inicio">
          <span className="badge" role="img" aria-label="Logo de unmate.es" />
          <span className="brand-name">
            unmate<b>.es</b>
          </span>
        </a>
        <nav className="nav" aria-label="Principal">
          <a href="#elegir">Elegí tu mate</a>
          <a href="#catalogo">Catálogo</a>
          <a href="#equipo">Armá tu equipo</a>
          <a href="#curado">Curado</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <ThemeToggle />
        <CartButton />
      </div>
    </header>
  );
}
