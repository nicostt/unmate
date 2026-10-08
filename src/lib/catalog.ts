import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import type { Catalog, Shape } from "./types";

// Único lugar de donde la web saca el catálogo: las tablas `categories` y
// `products` de Supabase. Solo llegan los productos visibles (is_active),
// porque así lo deciden las reglas de seguridad de la base.
//
// "use cache" guarda el resultado para no consultar la base en cada visita.
// Se renueva solo cada pocos minutos: un cambio de precio o de stock tarda
// como mucho eso en verse en la web.
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const [categories, products] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .from("products")
      .select("slug, name, shape, material, description, price, compare_at_price, stock, categories(slug)")
      .order("sort_order"),
  ]);
  if (categories.error) throw new Error(`No se pudieron leer las categorías: ${categories.error.message}`);
  if (products.error) throw new Error(`No se pudieron leer los productos: ${products.error.message}`);

  return {
    categories: categories.data,
    products: products.data.map((p) => ({
      slug: p.slug,
      name: p.name,
      // la librería no sabe que cada producto tiene una sola categoría
      category: (p.categories as unknown as { slug: string }).slug,
      shape: p.shape as Shape,
      material: p.material,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compare_at_price,
      stock: p.stock,
      images: imagesOf(p.slug),
    })),
  };
}

// Fotos de un producto: todos los archivos de imagen que haya en
// public/productos/<slug>/, ordenados por nombre (1.jpg, 2.jpg, 10.jpg...).
// La primera es la principal. Provisorio hasta que las fotos se suban desde
// el panel de administración.
const PHOTOS_DIR = path.join(process.cwd(), "public", "productos");

function imagesOf(slug: string): string[] {
  const dir = path.join(PHOTOS_DIR, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((file) => `/productos/${slug}/${file}`);
}
