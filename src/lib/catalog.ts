import { cacheLife, cacheTag } from "next/cache";
import { photoUrl, supabase } from "./supabase";
import type { Catalog, Shape } from "./types";

// Único lugar de donde la web saca el catálogo: las tablas `categories`,
// `products` y `product_media` de Supabase. Solo llegan los productos
// visibles (is_active), porque así lo deciden las reglas de la base.
//
// "use cache" guarda el resultado para no consultar la base en cada visita.
// Se renueva solo cada pocos minutos, y al instante cuando se cambia algo
// desde el panel (ver refreshCatalog en src/lib/admin-actions.ts).
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const [categories, products] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .from("products")
      .select(
        "slug, name, shape, material, description, price, compare_at_price, stock, categories(slug), product_media(kind, path, sort_order)",
      )
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
      images: p.product_media
        .filter((m) => m.kind === "image")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => photoUrl(m.path)),
    })),
  };
}
