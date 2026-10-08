"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCart, setCart, useCart } from "@/lib/cart-store";
import { saveCart, track, trackVisit } from "@/lib/track";
import {
  cartKey,
  lineTotal,
  maxQty,
  productLabel,
  stepOf,
  weightLabel,
  type CartLine,
  type Catalog,
  type Category,
  type Design,
  type Product,
} from "@/lib/types";
import { CartDrawer } from "./CartDrawer";

// "Contexto" de la tienda: comparte el catálogo y el carrito con cualquier
// componente de la página, sin tener que pasarlos a mano de uno a otro.
// Se usa con el hook useShop().
//
// El carrito guarda { key: cantidad }. La key es el slug del producto, o
// "slug#idDeDiseño" si se eligió un diseño (ver cartKey en src/lib/types.ts).
// La cantidad son unidades, o gramos si el producto se vende por peso.

type Shop = {
  categories: Category[];
  products: Product[];
  lines: CartLine[]; // lo que hay en el carrito, con su cantidad
  count: number; // cuántas cosas hay (cada yerba cuenta como una)
  total: number; // en pesos
  add: (key: string, amount?: number) => boolean; // false si no alcanza el stock
  addMany: (keys: string[]) => number; // devuelve cuántos pudo sumar
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void; // vaciar el carrito
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

type Found = { product: Product; design: Design | null };

export function ShopProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const { categories, products } = catalog;
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ text: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Índice para encontrar producto y diseño a partir de una key del carrito.
  const byKey = new Map<string, Found>();
  for (const product of products) {
    if (product.byDesign) {
      for (const design of product.designs) byKey.set(cartKey(product, design), { product, design });
    } else {
      byKey.set(cartKey(product, null), { product, design: null });
    }
  }

  // Si algo guardado en el carrito ya no existe en el catálogo (por ejemplo,
  // un diseño que se vendió), se ignora.
  const lines: CartLine[] = Object.entries(cart).flatMap(([key, qty]) => {
    const found = byKey.get(key);
    return found ? [{ key, ...found, qty }] : [];
  });
  const count = lines.reduce((sum, line) => sum + (line.product.byWeight ? 1 : line.qty), 0);
  const total = lines.reduce((sum, line) => sum + lineTotal(line.product, line.qty), 0);

  // Estadísticas: la visita se anota una vez; el carrito, un rato después de
  // cada cambio (así no se manda un aviso por cada clic).
  useEffect(trackVisit, []);
  const cartSummary = JSON.stringify(
    lines.map((l) => ({ slug: l.product.slug, qty: l.qty, design: l.design?.id ?? null })),
  );
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => saveCart(JSON.parse(cartSummary)), 1500);
    return () => clearTimeout(timer);
  }, [cartSummary]);

  function notify(text: string) {
    setToast({ text, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }

  // Suma `amount` al carrito: una unidad, o 250 g, si no se indica otra cosa.
  function add(key: string, amount?: number): boolean {
    const found = byKey.get(key);
    if (!found) return false;
    const { product, design } = found;
    const name = productLabel(product, design);
    const plus = amount ?? stepOf(product);
    const max = maxQty(product, design);
    const current = getCart();
    const qty = current[key] ?? 0;
    if (qty + plus > max) {
      notify(
        design
          ? `"${name}" ya está en tu carrito: es una pieza única`
          : product.byWeight
            ? `De "${name}" quedan ${weightLabel(max)}`
            : product.stock === 1
              ? `De "${name}" queda una sola unidad`
              : `No queda más stock de "${name}"`,
      );
      return false;
    }
    setCart({ ...current, [key]: qty + plus });
    notify(product.byWeight ? `Agregado: ${weightLabel(plus)} de ${name}` : `Agregado: ${name}`);
    track("add", { slug: product.slug, design: design?.id });
    return true;
  }

  function addMany(keys: string[]): number {
    const next = { ...getCart() };
    let added = 0;
    for (const key of keys) {
      const found = byKey.get(key);
      if (!found) continue;
      const qty = next[key] ?? 0;
      if (qty + stepOf(found.product) <= maxQty(found.product, found.design)) {
        next[key] = qty + stepOf(found.product);
        added++;
        track("add", { slug: found.product.slug, design: found.design?.id });
      }
    }
    if (added) setCart(next);
    return added;
  }

  function decrement(key: string) {
    const found = byKey.get(key);
    const next = { ...getCart() };
    next[key] = (next[key] ?? 0) - (found ? stepOf(found.product) : 1);
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
    clear: () => setCart({}),
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
