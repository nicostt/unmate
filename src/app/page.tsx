import { Catalog } from "@/components/shop/Catalog";
import { KitBuilder } from "@/components/shop/KitBuilder";
import { ShopProvider } from "@/components/shop/ShopProvider";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { CureGuide } from "@/components/site/CureGuide";
import { ChooseGuide } from "@/components/site/Guide";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { Reviews } from "@/components/site/Reviews";
import { getCatalog } from "@/lib/catalog";
import { getEndImage, getHeroMedia } from "@/lib/hero";

// La página armada se guarda y se rearma sola a la hora como mucho (lo mismo
// que el catálogo, ver src/lib/catalog.ts); el panel la refresca al instante.
// El número va escrito así, sin cuentas, porque Next lo lee sin ejecutar el código.
export const revalidate = 3600;

// Página de inicio. Se arma en el servidor: busca el catálogo y se lo pasa a
// ShopProvider, que lo comparte con el carrito y las secciones interactivas.
export default async function Home() {
  const catalog = await getCatalog();

  return (
    <ShopProvider catalog={catalog}>
      <Header />
      <main>
        {/* El orden de la página se decide acá: cada línea es una sección. */}
        <Hero media={getHeroMedia(catalog.products)} />
        <Catalog />
        <ChooseGuide />
        <KitBuilder />
        <CureGuide />
        <Reviews reviews={catalog.reviews} />
        <About />
        <Contact />
      </main>
      <Footer image={getEndImage(catalog.products)} />
      <Reveal />
    </ShopProvider>
  );
}
