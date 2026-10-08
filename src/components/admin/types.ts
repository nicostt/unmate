// Filas tal como están guardadas en la base (nombres de columna en inglés).

export type AdminCategory = { id: number; slug: string; name: string; sort_order: number };

// design_id: a qué diseño pertenece la foto; null = foto general del producto.
export type AdminMedia = { id: number; kind: string; path: string; sort_order: number; design_id: number | null };

export type AdminDesign = { id: number; number: number };

// Recordar: en la yerba suelta (by_weight), `price` es el precio del KILO
// y `stock` está en GRAMOS. En los productos por diseños
// (by_design) el stock es la cantidad de diseños cargados. Ver src/lib/types.ts.
export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  category_id: number;
  shape: string;
  material: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  is_active: boolean;
  by_design: boolean;
  by_weight: boolean; // yerba suelta
  weight_extra: number; // % más caro el kilo llevando menos de 1 kg
  weight_discount: number; // % más barato el kilo llevando 2 kg o más
  sort_order: number;
  product_media: AdminMedia[];
  product_designs: AdminDesign[];
};

// Fotos de un diseño (o las generales del producto, con designId = null),
// en el orden en que se muestran.
export function photosOf(product: AdminProduct, designId: number | null = null): AdminMedia[] {
  return product.product_media
    .filter((m) => m.kind === "image" && m.design_id === designId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Diseños de un producto, por número.
export function designsOf(product: AdminProduct): AdminDesign[] {
  return [...product.product_designs].sort((a, b) => a.number - b.number);
}

// Foto que representa al producto en las listas del panel.
export function coverOf(product: AdminProduct): AdminMedia | undefined {
  if (!product.by_design) return photosOf(product)[0];
  const first = designsOf(product)[0];
  return first && photosOf(product, first.id)[0];
}

// "Camionero Premium" -> "camionero-premium": el nombre interno, sin tildes ni espacios.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "34.900" o "$ 34900" -> 34900. Vacío -> null. Otra cosa -> NaN (inválido).
export function toInt(text: string): number | null {
  const clean = text.replace(/[\s.$]/g, "");
  if (clean === "") return null;
  return /^\d+$/.test(clean) ? Number(clean) : NaN;
}

// Kilos escritos a mano -> gramos: "12,5" o "12.5" -> 12500.
// Vacío -> null. Otra cosa -> NaN (inválido).
export function kilosToGrams(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (clean === "") return null;
  return /^\d+(\.\d+)?$/.test(clean) ? Math.round(Number(clean) * 1000) : NaN;
}

// Gramos -> kilos para mostrar en un casillero: 12500 -> "12,5". null -> "".
export function gramsToKilos(grams: number | null): string {
  return grams === null ? "" : String(grams / 1000).replace(".", ",");
}
