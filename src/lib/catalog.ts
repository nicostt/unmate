import { cacheLife, cacheTag } from "next/cache";
import { photoUrl, supabase } from "./supabase";
import { weightTiers, type Catalog, type KitDiscount, type Review, type Shape } from "./types";

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
  by_weight: boolean;
  weight_extra: number;
  weight_discount: number;
  categories: { slug: string };
  product_designs: { id: number; number: number }[];
  product_media: { kind: string; path: string; sort_order: number; design_id: number | null }[];
};

type ReviewRow = {
  id: number;
  name: string;
  text: string | null;
  photos: string[];
  avatar: string | null;
  featured: boolean;
};

// El descuento por armar equipo, tal como lo guardó el panel. Solo vale si
// está prendido (más de 0 %) y con números razonables.
function readKit(value: unknown): KitDiscount | null {
  const { percent, min } = (value ?? {}) as { percent?: unknown; min?: unknown };
  const ok =
    Number.isInteger(percent) && Number.isInteger(min) &&
    (percent as number) >= 1 && (percent as number) <= 90 && (min as number) >= 2;
  return ok ? { percent: percent as number, min: min as number } : null;
}

// Único lugar de donde la web saca lo que muestra: catálogo (`categories`,
// `products`, `product_designs`, `product_media`) y reseñas (`reviews`).
// Solo llegan los productos y reseñas visibles, porque así lo deciden las
// reglas de la base.
//
// "use cache" guarda el resultado para no consultar la base en cada visita.
// Se renueva solo cada pocos minutos, y al instante cuando se cambia algo
// desde el panel (ver refreshCatalog en src/lib/admin-actions.ts).
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const [categories, products, reviews, kit] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .from("products")
      .select(
        "slug, name, shape, material, description, price, compare_at_price, stock, by_design, " +
          "by_weight, weight_extra, weight_discount, categories(slug), " +
          "product_designs(id, number), product_media(kind, path, sort_order, design_id)",
      )
      .order("sort_order")
      .overrideTypes<ProductRow[]>(),
    supabase.from("reviews").select("id, name, text, photos, avatar, featured").order("sort_order"),
    supabase.from("settings").select("value").eq("key", "kit_discount").maybeSingle(),
  ]);
  if (categories.error) throw new Error(`No se pudieron leer las categorías: ${categories.error.message}`);
  if (products.error) throw new Error(`No se pudieron leer los productos: ${products.error.message}`);

  // Las reseñas y el descuento por equipo son extras: si fallan, la tienda
  // sigue andando sin ellos.
  const reviewRows = (reviews.data ?? []) as ReviewRow[];

  return {
    categories: categories.data,
    kit: readKit(kit.data?.value),
    reviews: reviewRows.map(
      (r): Review => ({ ...r, photos: r.photos.map(photoUrl), avatar: r.avatar && photoUrl(r.avatar) }),
    ),
    products: products.data.map((p) => {
      // fotos de un diseño (o las generales, con designId = null), en orden
      const photos = (designId: number | null) =>
        p.product_media
          .filter((m) => m.kind === "image" && m.design_id === designId)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => photoUrl(m.path));

      return {
        slug: p.slug,
        name: p.name,
        category: p.categories.slug,
        byWeight: p.by_weight,
        tiers: p.by_weight ? weightTiers(p.weight_extra, p.weight_discount) : [],
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
