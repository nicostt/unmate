// Filas tal como están guardadas en la base (nombres de columna en inglés).

export type AdminCategory = { id: number; slug: string; name: string };

export type AdminMedia = { id: number; kind: string; path: string; sort_order: number };

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
