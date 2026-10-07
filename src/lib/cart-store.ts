import { useSyncExternalStore } from "react";

// El carrito es un objeto { slug del producto: cantidad } guardado en el
// localStorage del navegador, para que no se pierda al recargar la página.
// useSyncExternalStore es la forma que da React de leer algo que vive fuera
// de React (acá, localStorage) sin desfasarse entre servidor y navegador.

export type Cart = Record<string, number>;

const KEY = "unmate-cart";
const EMPTY: Cart = {};

let cart: Cart = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Cart {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (!raw || typeof raw !== "object") return EMPTY;
    const clean: Cart = {};
    for (const [slug, qty] of Object.entries(raw)) {
      if (typeof qty === "number" && qty > 0) clean[slug] = Math.floor(qty);
    }
    return clean;
  } catch {
    return EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Cart {
  if (!loaded) {
    cart = read();
    loaded = true;
  }
  return cart;
}

// En el servidor no hay localStorage: el carrito siempre arranca vacío.
function getServerSnapshot(): Cart {
  return EMPTY;
}

export function getCart(): Cart {
  return getSnapshot();
}

export function setCart(next: Cart) {
  cart = next;
  loaded = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // modo privado o almacenamiento lleno: el carrito sigue andando en memoria
  }
  listeners.forEach((listener) => listener());
}

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
