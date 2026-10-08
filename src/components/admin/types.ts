// Filas tal como están guardadas en la base (nombres de columna en inglés).

export type AdminCategory = { id: number; slug: string; name: string; sort_order: number };

export type AdminMedia = { id: number; kind: string; path: string; sort_order: number };

export type AdminVariant = {
  id: number;
  label: string;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  sort_order: number;
};

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
  product_variants: AdminVariant[];
};

// Fotos de un producto, en el orden en que se muestran.
export function photosOf(product: AdminProduct): AdminMedia[] {
  return product.product_media
    .filter((m) => m.kind === "image")
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Presentaciones de un producto, en el orden en que se muestran.
export function variantsOf(product: AdminProduct): AdminVariant[] {
  return [...product.product_variants].sort((a, b) => a.sort_order - b.sort_order);
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

// Revisa precio, precio "antes" y stock escritos en un formulario.
// Devuelve los números listos para guardar, o el mensaje de error.
export function parsePricing(priceText: string, compareText: string, stockText: string) {
  const price = toInt(priceText);
  const compare_at_price = toInt(compareText);
  const stock = toInt(stockText);
  if (price === null || Number.isNaN(price)) return { error: "El precio tiene que ser un número." };
  if (Number.isNaN(compare_at_price)) return { error: 'El precio "antes" tiene que ser un número o quedar vacío.' };
  if (compare_at_price !== null && compare_at_price <= price)
    return { error: 'El precio "antes" tiene que ser mayor que el precio actual.' };
  if (Number.isNaN(stock)) return { error: "El stock tiene que ser un número o quedar vacío." };
  return { values: { price, compare_at_price, stock } };
}
