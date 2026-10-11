import type { Metadata } from "next";
import Link from "next/link";
import { LostFace } from "@/components/site/LostFace";
import "@/styles/not-found.css";

// Página de error 404: lo que se ve al entrar a una dirección que no existe.
export const metadata: Metadata = {
  title: "Nos quedamos sin agua — unmate.es",
};

export default function NotFound() {
  return (
    <main className="lost">
      <p className="lost-number" aria-label="Error 404">
        <span aria-hidden="true">4</span>
        <LostFace />
        <span aria-hidden="true">4</span>
      </p>
      <h1>Nos quedamos sin agua pal mate</h1>
      <p className="lead">
        Esta página no existe, o se mudó. Mientras calentamos otra pava, volvé a la tienda: ahí sí hay de todo.
      </p>
      <Link className="btn accent" href="/">
        Volver a la tienda
      </Link>
    </main>
  );
}
