"use client";

import { createContext, useContext, useRef, useState } from "react";
import { getCart, setCart, useCart } from "@/lib/cart-store";
import type { CartLine } from "@/lib/site";
import type { Catalog, Category, Product } from "@/lib/types";
import { CartDrawer } from "./CartDrawer";

// "Contexto" de la tienda: comparte el catálogo y el carrito con cualquier
// componente de la página, sin tener que pasarlos a mano de uno a otro.
// Se usa con el hook useShop().

type Shop = {
  categories: Category[];
  products: Product[];
  lines: CartLine[]; // productos en el carrito, con su cantidad
  count: number; // unidades totales
  total: number; // en pesos
  add: (slug: string) => boolean; // false si no queda stock
  addMany: (slugs: string[]) => number; // devuelve cuántos pudo sumar
  decrement: (slug: string) => void;
  remove: (slug: string) => void;
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
const maxQty = (product: Product) => product.stock ?? 99;

export function ShopProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const { categories, products } = catalog;
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ text: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Si un producto guardado en el carrito ya no existe en el catálogo, se ignora.
  const lines: CartLine[] = Object.entries(cart).flatMap(([slug, qty]) => {
    const product = bySlug.get(slug);
    return product ? [{ product, qty }] : [];
  });
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  function notify(text: string) {
    setToast({ text, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }

  function add(slug: string): boolean {
    const product = bySlug.get(slug);
    if (!product) return false;
    const current = getCart();
    const qty = current[slug] ?? 0;
    if (qty >= maxQty(product)) {
      notify(
        product.stock === 1
          ? `De "${product.name}" queda una sola unidad`
          : `No queda más stock de "${product.name}"`,
      );
      return false;
    }
    setCart({ ...current, [slug]: qty + 1 });
    notify(`Agregado: ${product.name}`);
    return true;
  }

  function addMany(slugs: string[]): number {
    const next = { ...getCart() };
    let added = 0;
    for (const slug of slugs) {
      const product = bySlug.get(slug);
      const qty = next[slug] ?? 0;
      if (product && qty < maxQty(product)) {
        next[slug] = qty + 1;
        added++;
      }
    }
    if (added) setCart(next);
    return added;
  }

  function decrement(slug: string) {
    const next = { ...getCart() };
    next[slug] = (next[slug] ?? 0) - 1;
    if (next[slug] <= 0) delete next[slug];
    setCart(next);
  }

  function remove(slug: string) {
    const next = { ...getCart() };
    delete next[slug];
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
