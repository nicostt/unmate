import Image from "next/image";
import { ProductArt } from "@/components/shop/ProductArt";
import { getAboutPhoto } from "@/lib/hero";

// "Quién soy": la persona detrás de la tienda, con su foto. Va después de
// las reseñas (el orden de la página está en src/app/page.tsx).
//
// Texto y foto los pasó Emanuel (24/10/2026).
//  - El texto se cambia acá abajo: el título, un párrafo por renglón y la firma.
//  - La foto es public/quien-soy.jpg (o .webp / .png) y aparece sola;
//    conviene que sea vertical. Si no está, se ve un recuadro que marca dónde va.
//  - Si `ready` pasa a false, la sección se ve en la compu (npm run dev) pero
//    NO en la web publicada (sirve para preparar un texto nuevo sin mostrarlo).
const ABOUT = {
  ready: true,
  title: "Hola, soy Emanuel",
  paragraphs: [
    "Mi nombre es Emanuel Soto, soy de Villa Constitución y creé unmate.es, un emprendimiento que arrancó como hobby el 26/08/2026 y que hasta el día de hoy lo sigue siendo.",
    "Me gusta la historia que puede haber detrás de cada mate, lo que puede significar para cada uno: algo tan simple que, sin darte cuenta, te acompaña todos los días y a todos lados. Mi idea es acercarles la posibilidad de elegir algo tan simple pero especial como un mate, seleccionando lo mejor, cuidando la calidad y estando a disposición ante el primer problema que pueda surgir.",
    "Sin más que decir, gracias a todos los que me ayudan a seguir creciendo. Por cualquier duda, tienen mi contacto acá abajo.",
  ],
  signature: "Emanuel",
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
