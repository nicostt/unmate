"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { cartKey, isSoldOut } from "@/lib/types";
import { useShop } from "./ShopProvider";

// "Armá tu equipo": elegís mate, bombilla y termo y se suman juntos al carrito.
export function KitBuilder() {
  const { products, addMany, openCart, notify } = useShop();

  // solo se ofrece lo que hay para vender
  const available = products.filter((p) => !isSoldOut(p));
  const mates = available.filter((p) => p.category === "mates");
  const bombillas = available.filter((p) => p.category === "bombillas");
  const termos = available.filter((p) => p.category === "termos");

  // Combo sugerido de entrada; si esos productos no están, el primero de la lista.
  const pick = (list: typeof products, preferred: string) =>
    (list.find((p) => p.slug === preferred) ?? list[0])?.slug ?? "";

  const [mate, setMate] = useState(() => pick(mates, "camionero-criollo-calabaza"));
  const [bombilla, setBombilla] = useState(() => pick(bombillas, "bombilla-pico-loro"));
  const [termo, setTermo] = useState("");

  const chosen = available.filter((p) => [mate, bombilla, termo].includes(p.slug));
  const total = chosen.reduce((sum, p) => sum + p.price, 0);

  function addKit() {
    // de un mate por diseños va el primero disponible; el cliente lo puede cambiar desde el catálogo
    if (addMany(chosen.map((p) => cartKey(p, p.designs[0] ?? null)))) {
      notify("Equipo agregado al carrito");
      openCart();
    } else {
      notify("Esos productos ya están en tu carrito");
    }
  }

  const options = (list: typeof products) =>
    list.map((p) => (
      <option key={p.slug} value={p.slug}>
        {p.name} · {money(p.price)}
      </option>
    ));

  return (
    <section className="wrap block" id="equipo">
      <div className="kit">
        <div>
          <p className="eyebrow">Combo a tu medida</p>
          <h2>Armá tu equipo</h2>
          <p className="muted">
            Elegí mate, bombilla y termo, mirá cuánto sale todo junto y sumalo al carrito de una vez.
          </p>
        </div>
        <div className="kit-form">
          <label>
            Mate
            <select value={mate} onChange={(e) => setMate(e.target.value)}>
              {options(mates)}
            </select>
          </label>
          <label>
            Bombilla o bombillón
            <select value={bombilla} onChange={(e) => setBombilla(e.target.value)}>
              <option value="">Sin bombilla</option>
              {options(bombillas)}
            </select>
          </label>
          <label>
            Termo
            <select value={termo} onChange={(e) => setTermo(e.target.value)}>
              <option value="">Sin termo</option>
              {options(termos)}
            </select>
          </label>
          <div className="kit-total">
            <span className="muted">Total del equipo</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="btn primary" type="button" onClick={addKit}>
            Agregar equipo al carrito
          </button>
        </div>
      </div>
    </section>
  );
}
