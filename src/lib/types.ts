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

// Los campos opcionales usan `null` (y no `undefined`) porque así los
// devuelve la base de datos.
//
// Hay dos formas de vender un producto:
//  - por unidad (mates, bombillas, termos): `price` es el precio de uno y
//    `stock` son unidades;
//  - por peso (yerba, byWeight = true): `price` es el precio del KILO y
//    `stock` son GRAMOS.
// En el carrito la cantidad sigue la misma regla: unidades o gramos.
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
  images: string[]; // direcciones de las fotos, en el orden en que se muestran
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};

// Un renglón del carrito. qty = unidades, o gramos si el producto va por peso.
export type CartLine = { product: Product; qty: number };

// Todo lo que esté en esta categoría se vende por peso.
export const WEIGHT_CATEGORY = "yerba";

// La yerba se vende de a 250 g.
export const WEIGHT_STEP = 250;

// De a cuánto se suma o se resta en el carrito.
export function stepOf(product: Product): number {
  return product.byWeight ? WEIGHT_STEP : 1;
}

// Tope de compra: el stock, o un máximo razonable si no se controla.
export function maxQty(product: Product): number {
  return product.stock ?? (product.byWeight ? 10_000 : 99);
}

// ¿No alcanza el stock ni para la compra mínima?
export function isSoldOut(product: Product): boolean {
  return product.stock !== null && product.stock < stepOf(product);
}

// Precio de una cantidad: unidades × precio, o la parte del kilo que corresponda.
export function lineTotal(product: Product, qty: number): number {
  return product.byWeight ? Math.round((product.price * qty) / 1000) : product.price * qty;
}

// 750 -> "750 g" · 1000 -> "1 kg" · 1250 -> "1,25 kg"
export function weightLabel(grams: number): string {
  return grams < 1000 ? `${grams} g` : `${String(grams / 1000).replace(".", ",")} kg`;
}

// Cómo se nombra un renglón del pedido: "2 × Ranchero" o "750 g de Yerba Canarias".
export function lineLabel(product: Product, qty: number): string {
  return product.byWeight ? `${weightLabel(qty)} de ${product.name}` : `${qty} × ${product.name}`;
}

// "$ 8.000 el kg", para mostrar junto al precio de la yerba.
export function perKiloLabel(product: Product): string {
  return `${money(product.price)} el kg`;
}
