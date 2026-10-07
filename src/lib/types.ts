// Formas que sabe dibujar ProductArt mientras no haya fotos reales.
export type Shape =
  | "camionero"
  | "imperial"
  | "torpedo"
  | "ranchero"
  | "criollo"
  | "termo"
  | "bombillon"
  | "bombillon-curvo"
  | "loro";

export type Category = {
  slug: string;
  name: string;
};

// Los campos opcionales usan `null` (y no `undefined`) porque así los
// devuelve la base de datos: de esa forma el tipo sirve para las dos fuentes.
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
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};
