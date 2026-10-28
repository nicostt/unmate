import { unstable_cache } from "next/cache";
import { photoUrl, supabase } from "./supabase";
import { PRODUCT_TYPES, weightTiers, type Catalog, type KitDiscount, type ProductType, type Review, type Shape } from "./types";

const TYPE_KEYS = new Set<string>(PRODUCT_TYPES.map((t) => t.key));

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
  types?: string[]; // no viene si todavía no se corrió la migración 0010
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
// Columnas de cada producto que lee la tienda.
const PRODUCT_COLUMNS =
  "slug, name, shape, material, description, price, compare_at_price, stock, by_design, " +
  "by_weight, weight_extra, weight_discount, categories(slug), " +
  "product_designs(id, number), product_media(kind, path, sort_order, design_id)";

// Lee los productos con sus tipos. Si la base todavía no tiene la columna
// `types` (falta correr la migración 0010), los lee sin ella: la tienda sigue
// andando y simplemente no hay "Ver en catálogo".
async function readProducts() {
  const withTypes = await supabase
    .from("products")
    .select(`${PRODUCT_COLUMNS}, types`)
    .order("sort_order")
    .overrideTypes<ProductRow[]>();
  if (!withTypes.error || withTypes.error.code !== "42703") return withTypes;
  return supabase.from("products").select(PRODUCT_COLUMNS).order("sort_order").overrideTypes<ProductRow[]>();
}

// La web no la llama directo: usa getCatalog (al final del archivo), que
// guarda el resultado.
async function readCatalog(): Promise<Catalog> {
  const [categories, products, reviews, kit] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    readProducts(),
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
        types: (p.types ?? []).filter((t): t is ProductType => TYPE_KEYS.has(t)),
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

// Lo que usa la web: el catálogo guardado, para no consultar la base en cada
// visita. Se renueva al instante cuando se cambia algo desde el panel (ver
// refreshCatalog en src/lib/admin-actions.ts; también al cambiar el estado de
// un pedido, que mueve el stock) y, por las dudas, solo una vez por hora: lo
// que se edite directo en Supabase, sin pasar por el panel, tarda hasta eso.
// Una hora y no minutos porque en Cloudflare cada renovación es una escritura
// en KV, y el plan gratis permite 1000 por día.
//
// Usa unstable_cache (la caché "clásica" de Next) y no "use cache": con
// "use cache" (Cache Components) la página se cuelga en Cloudflare cuando
// tiene que rearmarse. Es un error conocido de Next + OpenNext
// (vercel/next.js#94880, opennextjs/opennextjs-cloudflare#1450). Cuando lo
// arreglen se puede volver a "use cache".
export const getCatalog = unstable_cache(readCatalog, ["catalog"], { tags: ["catalog"], revalidate: 3600 });
