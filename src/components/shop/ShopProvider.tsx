"use client";

import { createContext, useContext, useRef, useState } from "react";
import { getCart, setCart, useCart } from "@/lib/cart-store";
import { optionName, type CartLine, type Catalog, type Category, type Product, type ProductOption } from "@/lib/types";
import { CartDrawer } from "./CartDrawer";

// "Contexto" de la tienda: comparte el catálogo y el carrito con cualquier
// componente de la página, sin tener que pasarlos a mano de uno a otro.
// Se usa con el hook useShop().
//
// El carrito guarda { key: cantidad }, donde key identifica una opción de
// compra (ProductOption.key): un mate, o una presentación de yerba.

type Shop = {
  categories: Category[];
  products: Product[];
  lines: CartLine[]; // lo que hay en el carrito, con su cantidad
  count: number; // unidades totales
  total: number; // en pesos
  add: (key: string) => boolean; // false si no queda stock
  addMany: (keys: string[]) => number; // devuelve cuántos pudo sumar
  decrement: (key: string) => void;
  remove: (key: string) => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void; // cartelito que aparece abajo
};

const ShopContext = createContext<Shop | null>(null);

export function useShop(): Shop {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop se usa dentro de <ShopProvider>");
  return shop;
}

// Sin stock cargado, se deja sumar hasta 99 unidades.
const maxQty = (option: ProductOption) => option.stock ?? 99;

export function ShopProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const { categories, products } = catalog;
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ text: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Índice para encontrar rápido producto y opción a partir de una key.
  const byKey = new Map(products.flatMap((product) => product.options.map((option) => [option.key, { product, option }])));

  // Si algo guardado en el carrito ya no existe en el catálogo, se ignora.
  const lines: CartLine[] = Object.entries(cart).flatMap(([key, qty]) => {
    const found = byKey.get(key);
    return found ? [{ ...found, qty }] : [];
  });
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.option.price * line.qty, 0);

  function notify(text: string) {
    setToast({ text, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }

  function add(key: string): boolean {
    const found = byKey.get(key);
    if (!found) return false;
    const name = optionName(found.product, found.option);
    const current = getCart();
    const qty = current[key] ?? 0;
    if (qty >= maxQty(found.option)) {
      notify(found.option.stock === 1 ? `De "${name}" queda una sola unidad` : `No queda más stock de "${name}"`);
      return false;
    }
    setCart({ ...current, [key]: qty + 1 });
    notify(`Agregado: ${name}`);
    return true;
  }

  function addMany(keys: string[]): number {
    const next = { ...getCart() };
    let added = 0;
    for (const key of keys) {
      const found = byKey.get(key);
      const qty = next[key] ?? 0;
      if (found && qty < maxQty(found.option)) {
        next[key] = qty + 1;
        added++;
      }
    }
    if (added) setCart(next);
    return added;
  }

  function decrement(key: string) {
    const next = { ...getCart() };
    next[key] = (next[key] ?? 0) - 1;
    if (next[key] <= 0) delete next[key];
    setCart(next);
  }

  function remove(key: string) {
    const next = { ...getCart() };
    delete next[key];
    setCart(next);
  }

  const shop: Shop = {
    categories,
    products,
    lines,
    count,
    total,
    add,
    addMany,
    decrement,
    remove,
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    notify,
  };

  return (
    <ShopContext.Provider value={shop}>
      {children}
      <CartDrawer />
      <div className={toast.show ? "toast show" : "toast"} role="status" aria-live="polite">
        {toast.text}
      </div>
    </ShopContext.Provider>
  );
}
