// 34900 -> "$ 34.900"
export function money(n: number): string {
  return "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Porcentaje de descuento redondeado: (34900, 41900) -> 17
export function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round((1 - price / compareAtPrice) * 100);
}

// Minúsculas y sin tildes, para que buscar "bombillon" encuentre "Bombillón".
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
