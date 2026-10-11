import Image from "next/image";
import { ProductArt } from "@/components/shop/ProductArt";
import { getAboutPhoto } from "@/lib/hero";

// "Quién soy": la persona detrás de la tienda, con su foto. Va después de
// las reseñas (el orden de la página está en src/app/page.tsx).
//
// PENDIENTE: Nicolás pasa el texto y la foto.
//  - El texto se cambia acá abajo: el título, un párrafo por renglón y la firma.
//  - La foto se guarda como public/quien-soy.jpg (o .webp / .png) y aparece
//    sola; conviene que sea vertical. Mientras no esté, se ve un recuadro que
//    marca dónde va.
//  - Cuando el texto sea el definitivo, pasar `ready` a true. Mientras esté
//    en false la sección se ve en la compu (npm run dev) pero NO en la web
//    publicada: así nunca sale a la calle con el texto de relleno.
const ABOUT = {
  ready: false,
  title: "Hola, soy Nicolás",
  paragraphs: [
    "[Acá va tu texto. Primer párrafo: quién sos y cómo arrancó unmate.es.]",
    "[Segundo párrafo: qué te gusta de los mates, cómo elegís lo que vendés, por qué te compran a vos.]",
    "[Un cierre corto, que invite a escribirte.]",
  ],
  signature: "Nicolás",
};

export function About() {
  if (!ABOUT.ready && process.env.NODE_ENV === "production") return null;
  const photo = getAboutPhoto();

  return (
    <section className="wrap block" id="quien-soy" data-reveal>
      <div className="about">
        <div className="about-frame">
          <div className="about-photo">
            {photo ? (
              <Image src={photo} alt={`Foto de ${ABOUT.signature}`} fill sizes="(max-width: 820px) 80vw, 420px" />
            ) : (
              // todavía sin foto: se marca el lugar
              <span className="about-photo-empty">
                <ProductArt shape="camionero" />
                Acá va tu foto
              </span>
            )}
          </div>
        </div>
        <div className="about-text">
          <h2>{ABOUT.title}</h2>
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="about-signature">{ABOUT.signature}</p>
        </div>
      </div>
    </section>
  );
}
