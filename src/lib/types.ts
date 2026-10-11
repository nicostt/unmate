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

// Un tramo del precio por cantidad de la yerba suelta: "desde `min` gramos,
// el precio del kilo cambia un `percent` %". +10 = 10 % más caro; -8 = 8 %
// más barato.
export type WeightTier = { min: number; percent: number };

// Cada yerba suelta define dos porcentajes (panel, Editar la yerba):
//  - extra: cuánto MÁS CARO sale el kilo si se lleva menos de 1 kg;
//  - discount: cuánto MÁS BARATO sale si se llevan 2 kg o más.
// Entre 1 kg y 2 kg se cobra el precio normal. Esta función los convierte
// en tramos. La base de datos usa los mismos cortes (función create_order).
export function weightTiers(extra: number, discount: number): WeightTier[] {
  return [
    { min: 0, percent: extra },
    { min: 1000, percent: 0 },
    { min: 2000, percent: -discount },
  ];
}

// Una reseña de un cliente, cargada desde el panel.
export type Review = {
  id: number;
  name: string;
  text: string | null;
  photos: string[];
  avatar: string | null; // foto chica del cliente, al lado del nombre
  featured: boolean; // true = se ve siempre; false = aparece al tocar "Ver todas"
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
//  - por peso (yerba suelta, byWeight = true): `price` es el precio del
//    KILO y `stock` son GRAMOS. La yerba en paquete va por unidad;
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
  tiers: WeightTier[]; // ajuste del precio según cuánta yerba se lleve (vacío si no va por peso)
  byDesign: boolean;
  designs: Design[]; // vacío si el producto no va por diseños
  images: string[]; // fotos generales, en el orden en que se muestran
};

// Descuento por armar equipo. Lo define el admin en el panel (pestaña
// Productos): un `percent` % cuando el carrito trae productos de `min`
// partes del equipo o más.
export type KitDiscount = { percent: number; min: number };

export type Catalog = {
  categories: Category[];
  products: Product[];
  reviews: Review[];
  kit: KitDiscount | null; // null = no hay descuento por equipo
};

// Las partes de un equipo. `category` es el slug de la categoría donde viven
// esos productos. La base usa la misma lista (función create_order).
export const KIT_PARTS = [
  { id: "mate", label: "Mate", category: "mates" },
  { id: "bombilla", label: "Bombilla", category: "bombillas" },
  { id: "termo", label: "Termo", category: "termos" },
  { id: "yerba", label: "Yerba", category: "yerba" },
] as const;

export type KitPart = (typeof KIT_PARTS)[number];

// De qué parte del equipo es un producto, si es de alguna. La yerba suelta
// no cuenta: al equipo va el paquete.
export function kitPartOf(product: Product): KitPart | undefined {
  return product.byWeight ? undefined : KIT_PARTS.find((part) => part.category === product.category);
}

// Cuánto se ahorra por armar equipo con estos productos.
// Regla: si hay productos de `min` partes o más, se descuenta el `percent` %
// sobre UN producto de cada parte (el más caro), redondeado a $ 10.
// La base de datos hace la misma cuenta al registrar el pedido.
export function kitSaving(
  products: Product[],
  kit: KitDiscount | null,
): { parts: KitPart[]; amount: number } {
  const best = new Map<KitPart, number>();
  for (const product of products) {
    const part = kitPartOf(product);
    if (part) best.set(part, Math.max(best.get(part) ?? 0, product.price));
  }
  const parts = [...best.keys()];
  if (!kit || parts.length < kit.min) return { parts, amount: 0 };
  const sum = [...best.values()].reduce((a, b) => a + b, 0);
  return { parts, amount: Math.round((sum * kit.percent) / 1000) * 10 };
}

// Un renglón del carrito. `key` es lo que se guarda en el navegador: el slug
// del producto, o "slug#idDeDiseño" cuando se eligió un diseño puntual.
export type CartLine = { key: string; product: Product; design: Design | null; qty: number };

export function cartKey(product: Product, design: Design | null): string {
  return design ? `${product.slug}#${design.id}` : product.slug;
}

// Categoría donde vive la yerba, suelta o en paquete.
export const YERBA_CATEGORY = "yerba";

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

// Aviso de poco stock para mostrar en la tienda: "Últimas 3", "Últimas 2",
// "Última unidad" o "Agotado". Con más de tres (o sin control de stock) no
// se muestra nada.
export function stockLabel(product: Product): string | null {
  if (isSoldOut(product)) return "Agotado";
  if (product.byWeight) return null;
  const left = product.byDesign ? product.designs.length : product.stock;
  if (left === null || left > 3) return null;
  return left === 1 ? "Última unidad" : `Últimas ${left}`;
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

// Tramo de precio que corresponde a una cantidad de gramos: el de mayor
// `min` que no la supere.
export function tierFor(tiers: WeightTier[], grams: number): WeightTier | undefined {
  return tiers.filter((t) => t.min <= grams).sort((a, b) => b.min - a.min)[0];
}

// Precio de una cantidad de yerba: la parte del kilo que corresponda, con el
// ajuste de su tramo, redondeado a $ 10. La base de datos hace la misma
// cuenta al registrar el pedido (función create_order).
export function weightPrice(pricePerKilo: number, grams: number, tiers: WeightTier[]): number {
  const percent = tierFor(tiers, grams)?.percent ?? 0;
  return Math.round((pricePerKilo * grams * (100 + percent)) / 1_000_000) * 10;
}

// Precio de una cantidad: unidades × precio, o lo que salga esa cantidad de yerba.
export function lineTotal(product: Product, qty: number): number {
  return product.byWeight ? weightPrice(product.price, qty, product.tiers) : product.price * qty;
}

// Si llevando más conviene, devuelve desde cuánto y a cuánto queda el kilo.
// Sirve para el cartelito "Llevando 1 kg pagás $ X el kilo".
export function betterDeal(product: Product, grams: number): { from: number; perKilo: number } | null {
  const current = tierFor(product.tiers, grams)?.percent ?? 0;
  const next = product.tiers.filter((t) => t.min > grams && t.percent < current).sort((a, b) => a.min - b.min)[0];
  return next ? { from: next.min, perKilo: weightPrice(product.price, 1000, [{ min: 0, percent: next.percent }]) } : null;
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
