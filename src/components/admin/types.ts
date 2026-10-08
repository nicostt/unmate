// Filas tal como están guardadas en la base (nombres de columna en inglés).

export type AdminCategory = { id: number; slug: string; name: string; sort_order: number };

export type AdminMedia = { id: number; kind: string; path: string; sort_order: number };

// Recordar: en la yerba (productos de la categoría "yerba"), `price` es el
// precio del KILO y `stock` está en GRAMOS. Ver src/lib/types.ts.
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
  sort_order: number;
  product_media: AdminMedia[];
};

// Fotos de un producto, en el orden en que se muestran.
export function photosOf(product: AdminProduct): AdminMedia[] {
  return product.product_media
    .filter((m) => m.kind === "image")
    .sort((a, b) => a.sort_order - b.sort_order);
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
