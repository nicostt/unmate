import { cacheLife, cacheTag } from "next/cache";
import { photoUrl, supabase } from "./supabase";
import { WEIGHT_CATEGORY, type Catalog, type Review, type Shape, type WeightTier } from "./types";

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
  by_design: boolean;
  categories: { slug: string };
  product_designs: { id: number; number: number }[];
  product_media: { kind: string; path: string; sort_order: number; design_id: number | null }[];
};

// Único lugar de donde la web saca lo que muestra: catálogo (`categories`,
// `products`, `product_designs`, `product_media`), precios de la yerba por
// cantidad (`settings`) y reseñas (`reviews`). Solo llegan los productos y
// reseñas visibles, porque así lo deciden las reglas de la base.
//
// "use cache" guarda el resultado para no consultar la base en cada visita.
// Se renueva solo cada pocos minutos, y al instante cuando se cambia algo
// desde el panel (ver refreshCatalog en src/lib/admin-actions.ts).
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const [categories, products, tiers, reviews] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .from("products")
      .select(
        "slug, name, shape, material, description, price, compare_at_price, stock, by_design, categories(slug), " +
          "product_designs(id, number), product_media(kind, path, sort_order, design_id)",
      )
      .order("sort_order")
      .overrideTypes<ProductRow[]>(),
    supabase.from("settings").select("value").eq("key", "yerba_tiers").maybeSingle(),
    supabase.from("reviews").select("id, name, text, photos").order("sort_order"),
  ]);
  if (categories.error) throw new Error(`No se pudieron leer las categorías: ${categories.error.message}`);
  if (products.error) throw new Error(`No se pudieron leer los productos: ${products.error.message}`);

  // Los precios por cantidad y las reseñas son extras: si fallan (por ejemplo,
  // si todavía no se crearon sus tablas) la tienda sigue andando sin ellos.
  const weightTiers: WeightTier[] = Array.isArray(tiers.data?.value) ? tiers.data.value : [];
  const reviewRows = (reviews.data ?? []) as { id: number; name: string; text: string | null; photos: string[] }[];

  return {
    categories: categories.data,
    reviews: reviewRows.map((r): Review => ({ ...r, photos: r.photos.map(photoUrl) })),
    products: products.data.map((p) => {
      // fotos de un diseño (o las generales, con designId = null), en orden
      const photos = (designId: number | null) =>
        p.product_media
          .filter((m) => m.kind === "image" && m.design_id === designId)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => photoUrl(m.path));
      const byWeight = p.categories.slug === WEIGHT_CATEGORY;

      return {
        slug: p.slug,
        name: p.name,
        category: p.categories.slug,
        byWeight,
        tiers: byWeight ? weightTiers : [],
        byDesign: p.by_design,
        shape: p.shape as Shape,
        material: p.material,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compare_at_price,
        stock: p.stock,
        images: photos(null),
        // un diseño sin foto todavía no se muestra en la tienda
        designs: p.product_designs
          .map((d) => ({ id: d.id, number: d.number, images: photos(d.id) }))
          .filter((d) => d.images.length > 0)
          .sort((a, b) => a.number - b.number),
      };
    }),
  };
}
