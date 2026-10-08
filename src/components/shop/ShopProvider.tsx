"use client";

import { createContext, useContext, useRef, useState } from "react";
import { getCart, setCart, useCart } from "@/lib/cart-store";
import {
  lineTotal,
  maxQty,
  stepOf,
  weightLabel,
  type CartLine,
  type Catalog,
  type Category,
  type Product,
} from "@/lib/types";
import { CartDrawer } from "./CartDrawer";

// "Contexto" de la tienda: comparte el catálogo y el carrito con cualquier
// componente de la página, sin tener que pasarlos a mano de uno a otro.
// Se usa con el hook useShop().
//
// El carrito guarda { slug: cantidad }. La cantidad son unidades, o gramos
// si el producto se vende por peso (ver src/lib/types.ts).

type Shop = {
  categories: Category[];
  products: Product[];
  lines: CartLine[]; // lo que hay en el carrito, con su cantidad
  count: number; // cuántas cosas hay (cada yerba cuenta como una)
  total: number; // en pesos
  add: (slug: string, amount?: number) => boolean; // false si no alcanza el stock
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
  const count = lines.reduce((sum, line) => sum + (line.product.byWeight ? 1 : line.qty), 0);
  const total = lines.reduce((sum, line) => sum + lineTotal(line.product, line.qty), 0);

  function notify(text: string) {
    setToast({ text, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }

  // Suma `amount` al carrito: una unidad, o 250 g, si no se indica otra cosa.
  function add(slug: string, amount?: number): boolean {
    const product = bySlug.get(slug);
    if (!product) return false;
    const plus = amount ?? stepOf(product);
    const current = getCart();
    const qty = current[slug] ?? 0;
    if (qty + plus > maxQty(product)) {
      notify(
        product.byWeight
          ? `De "${product.name}" quedan ${weightLabel(maxQty(product))}`
          : product.stock === 1
            ? `De "${product.name}" queda una sola unidad`
            : `No queda más stock de "${product.name}"`,
      );
      return false;
    }
    setCart({ ...current, [slug]: qty + plus });
    notify(product.byWeight ? `Agregado: ${weightLabel(plus)} de ${product.name}` : `Agregado: ${product.name}`);
    return true;
  }

  function addMany(slugs: string[]): number {
    const next = { ...getCart() };
    let added = 0;
    for (const slug of slugs) {
      const product = bySlug.get(slug);
      if (!product) continue;
      const qty = next[slug] ?? 0;
      if (qty + stepOf(product) <= maxQty(product)) {
        next[slug] = qty + stepOf(product);
        added++;
      }
    }
    if (added) setCart(next);
    return added;
  }

  function decrement(slug: string) {
    const product = bySlug.get(slug);
    const next = { ...getCart() };
    next[slug] = (next[slug] ?? 0) - (product ? stepOf(product) : 1);
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
