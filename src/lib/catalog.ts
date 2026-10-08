import { cacheLife, cacheTag } from "next/cache";
import { photoUrl, supabase } from "./supabase";
import type { Catalog, ProductOption, Shape } from "./types";

// Único lugar de donde la web saca el catálogo: las tablas `categories`,
// `products`, `product_variants` y `product_media` de Supabase. Solo llegan
// los productos visibles (is_active), porque así lo deciden las reglas de la base.
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
        "slug, name, shape, material, description, price, compare_at_price, stock, categories(slug), " +
          "product_variants(id, label, price, compare_at_price, stock, sort_order), " +
          "product_media(kind, path, sort_order)",
      )
      .order("sort_order")
      .overrideTypes<ProductRow[]>(),
  ]);
  if (categories.error) throw new Error(`No se pudieron leer las categorías: ${categories.error.message}`);
  if (products.error) throw new Error(`No se pudieron leer los productos: ${products.error.message}`);

  return {
    categories: categories.data,
    products: products.data.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.categories.slug,
      shape: p.shape as Shape,
      material: p.material,
      description: p.description,
      options: optionsOf(p),
      images: p.product_media
        .filter((m) => m.kind === "image")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => photoUrl(m.path)),
    })),
  };
}

// Forma en que llega cada producto de la base.
type ProductRow = {
  slug: string;
  name: string;
  shape: string;
  material: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  categories: { slug: string };
  product_variants: {
    id: number;
    label: string;
    price: number;
    compare_at_price: number | null;
    stock: number | null;
    sort_order: number;
  }[];
  product_media: { kind: string; path: string; sort_order: number }[];
};

// Si el producto tiene presentaciones, esas son sus opciones de compra.
// Si no, tiene una sola opción: la del propio producto.
function optionsOf(p: ProductRow): ProductOption[] {
  if (p.product_variants.length === 0) {
    return [{ key: p.slug, label: null, price: p.price, compareAtPrice: p.compare_at_price, stock: p.stock }];
  }
  return [...p.product_variants]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({
      key: `${p.slug}::${v.id}`,
      label: v.label,
      price: v.price,
      compareAtPrice: v.compare_at_price,
      stock: v.stock,
    }));
}
