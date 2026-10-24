import Image from "next/image";
import { ProductArt } from "@/components/shop/ProductArt";
import { getAboutPhoto } from "@/lib/hero";

// "Quién soy": la persona detrás de la tienda, con su foto. Va después de
// las reseñas (el orden de la página está en src/app/page.tsx).
//
// Texto y foto los pasó Emanuel (24/10/2026). El texto va con SUS palabras
// (solo tildes y mayúsculas): no reescribirlo.
//  - El texto se cambia acá abajo: el título, un párrafo por renglón y la firma.
//  - La foto es public/quien-soy.jpg (o .webp / .png) y aparece sola;
//    conviene que sea vertical. Si no está, se ve un recuadro que marca dónde va.
//  - Si `ready` pasa a false, la sección se ve en la compu (npm run dev) pero
//    NO en la web publicada (sirve para preparar un texto nuevo sin mostrarlo).
const ABOUT = {
  ready: true,
  title: "Hola, soy Emanuel",
  paragraphs: [
    "Mi nombre es Emanuel Soto, oriundo de Villa Constitución y creador de unmate.es, emprendimiento que arrancó como hobby.",
    "Me gusta la historia que puede existir detrás de cada mate, con lo que puede significar para cada uno, algo tan simple que sin darte cuenta te acompaña todos los días, a todos lados. Mi idea está en acercarle a cada uno de ustedes poder elegir algo tan simple pero especial como un mate, buscando seleccionar lo mejor, cuidando la calidad y estando a disposición al primer problema que pueda ocurrir.",
    "Gracias a todos los que ayudan a seguir creciendo y por cualquier duda tienen mi contacto en la página, gracias.",
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
