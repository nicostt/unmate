import { money } from "./format";

// Formas que sabe dibujar ProductArt cuando un producto no tiene fotos.
export type Shape =
  | "camionero"
  | "imperial"
  | "torpedo"
  | "ranchero"
  | "criollo"
  | "termo"
  | "bombillon"
  | "bombillon-curvo"
  | "loro"
  | "yerba";

export type Category = {
  slug: string;
  name: string;
};

// Una pieza única de un tipo de mate: "Imperial de algarrobo · Diseño #2".
export type Design = {
  id: number;
  number: number;
  images: string[]; // la primera es la principal; las demás, otros ángulos
};

// Los campos opcionales usan `null` (y no `undefined`) porque así los
// devuelve la base de datos.
//
// Hay tres formas de vender un producto:
//  - por unidad (bombillas, termos): `price` es el precio de uno y `stock`
//    son unidades;
//  - por peso (yerba, byWeight = true): `price` es el precio del KILO y
//    `stock` son GRAMOS;
//  - por diseño (mates artesanales, byDesign = true): cada unidad es una
//    pieza distinta que está en `designs`. Todas valen `price`, y hay tantas
//    en stock como diseños cargados (`stock` no se usa).
// En el carrito la cantidad sigue la misma regla: unidades, gramos, o 1.
export type Product = {
  slug: string;
  name: string;
  category: string; // slug de la categoría
  shape: Shape;
  material: string | null;
  description: string | null;
  price: number; // en pesos, sin centavos
  compareAtPrice: number | null; // precio "antes", si está en oferta
  stock: number | null; // null = no se controla el stock
  byWeight: boolean;
  byDesign: boolean;
  designs: Design[]; // vacío si el producto no va por diseños
  images: string[]; // fotos generales, en el orden en que se muestran
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};

// Un renglón del carrito. `key` es lo que se guarda en el navegador: el slug
// del producto, o "slug#idDeDiseño" cuando se eligió un diseño puntual.
export type CartLine = { key: string; product: Product; design: Design | null; qty: number };

export function cartKey(product: Product, design: Design | null): string {
  return design ? `${product.slug}#${design.id}` : product.slug;
}

// Todo lo que esté en esta categoría se vende por peso.
export const WEIGHT_CATEGORY = "yerba";

// La yerba se vende de a 250 g.
export const WEIGHT_STEP = 250;

// De a cuánto se suma o se resta en el carrito.
export function stepOf(product: Product): number {
  return product.byWeight ? WEIGHT_STEP : 1;
}

// Tope de compra: 1 si es un diseño (pieza única); si no, el stock, o un
// máximo razonable cuando no se controla.
export function maxQty(product: Product, design: Design | null = null): number {
  if (design) return 1;
  return product.stock ?? (product.byWeight ? 10_000 : 99);
}

// ¿No hay nada para vender de este producto?
export function isSoldOut(product: Product): boolean {
  if (product.byDesign) return product.designs.length === 0;
  return product.stock !== null && product.stock < stepOf(product);
}

// Fotos que muestra la tarjeta: una por diseño, o las fotos generales.
export function coverImages(product: Product): string[] {
  return product.byDesign ? product.designs.map((d) => d.images[0]) : product.images;
}

// Precio de una cantidad: unidades × precio, o la parte del kilo que corresponda.
export function lineTotal(product: Product, qty: number): number {
  return product.byWeight ? Math.round((product.price * qty) / 1000) : product.price * qty;
}

// 750 -> "750 g" · 1000 -> "1 kg" · 1250 -> "1,25 kg"
export function weightLabel(grams: number): string {
  return grams < 1000 ? `${grams} g` : `${String(grams / 1000).replace(".", ",")} kg`;
}

// "Imperial de algarrobo · Diseño #2", o solo el nombre si no hay diseño.
export function productLabel(product: Product, design: Design | null): string {
  return design ? `${product.name} · Diseño #${design.number}` : product.name;
}

// Cómo se nombra un renglón del pedido: "2 × Termo", "750 g de Yerba X" o
// "1 × Imperial de algarrobo · Diseño #2".
export function lineLabel(line: Pick<CartLine, "product" | "design" | "qty">): string {
  const { product, design, qty } = line;
  return product.byWeight
    ? `${weightLabel(qty)} de ${product.name}`
    : `${qty} × ${productLabel(product, design)}`;
}

// "$ 8.000 el kg", para mostrar junto al precio de la yerba.
export function perKiloLabel(product: Product): string {
  return `${money(product.price)} el kg`;
}
