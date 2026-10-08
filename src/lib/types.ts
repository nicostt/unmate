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

// Una forma de comprar un producto, con su precio y su stock. La yerba tiene
// varias ("500 g", "1 kg"); un mate tiene una sola, sin etiqueta.
export type ProductOption = {
  key: string; // identificador único: es lo que se guarda en el carrito
  label: string | null; // "1 kg"; null si el producto tiene una sola opción
  price: number; // en pesos, sin centavos
  compareAtPrice: number | null; // precio "antes", si está en oferta
  stock: number | null; // null = no se controla el stock
};

export type Product = {
  slug: string;
  name: string;
  category: string; // slug de la categoría
  shape: Shape;
  material: string | null;
  description: string | null;
  options: ProductOption[]; // siempre hay al menos una
  images: string[]; // direcciones de las fotos, en el orden en que se muestran
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};

// Un renglón del carrito.
export type CartLine = { product: Product; option: ProductOption; qty: number };

// Precio más bajo del producto: el que se muestra con "desde" y por el que se ordena.
export function fromPrice(product: Product): number {
  return Math.min(...product.options.map((o) => o.price));
}

// "Yerba Canarias · 1 kg", o solo el nombre si hay una única opción.
export function optionName(product: Product, option: ProductOption): string {
  return option.label ? `${product.name} · ${option.label}` : product.name;
}
