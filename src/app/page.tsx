import { Catalog } from "@/components/shop/Catalog";
import { KitBuilder } from "@/components/shop/KitBuilder";
import { ShopProvider } from "@/components/shop/ShopProvider";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { ChooseGuide, CureGuide } from "@/components/site/Guide";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { Reviews } from "@/components/site/Reviews";
import { getCatalog } from "@/lib/catalog";

// Página de inicio. Se arma en el servidor: busca el catálogo y se lo pasa a
// ShopProvider, que lo comparte con el carrito y las secciones interactivas.
export default async function Home() {
  const catalog = await getCatalog();

  return (
    <ShopProvider catalog={catalog}>
      <Header />
      <main>
        {/* El orden de la página se decide acá: cada línea es una sección. */}
        <Hero />
        <Catalog />
        <ChooseGuide />
        <KitBuilder />
        <CureGuide />
        <Reviews reviews={catalog.reviews} />
        <Contact />
      </main>
      <Footer />
      <Reveal />
    </ShopProvider>
  );
}
