"use client";

import { useShop } from "./ShopProvider";

export function CartButton() {
  const { count, openCart } = useShop();
  return (
    <button className="cart-btn" type="button" onClick={openCart} aria-label="Abrir carrito">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
      <span className="cart-label">Carrito</span> <span id="cart-count">{count}</span>
    </button>
  );
}
