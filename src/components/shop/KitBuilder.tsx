"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { useShop } from "./ShopProvider";

// "Armá tu equipo": elegís mate, bombilla y termo y se suman juntos al carrito.
export function KitBuilder() {
  const { products, addMany, openCart, notify } = useShop();

  const mates = products.filter((p) => p.category === "mates");
  const bombillas = products.filter((p) => p.category === "bombillas");
  const termos = products.filter((p) => p.category === "termos");

  // Combo sugerido de entrada; si esos productos no están, el primero de la lista.
  const pick = (list: typeof products, preferred: string) =>
    (list.find((p) => p.slug === preferred) ?? list[0])?.slug ?? "";

  const [mate, setMate] = useState(() => pick(mates, "camionero-criollo-calabaza"));
  const [bombilla, setBombilla] = useState(() => pick(bombillas, "bombilla-pico-loro"));
  const [termo, setTermo] = useState("");

  // De cada producto elegido se toma su primera opción de compra.
  const chosen = products.filter((p) => [mate, bombilla, termo].includes(p.slug)).map((p) => p.options[0]);
  const total = chosen.reduce((sum, option) => sum + option.price, 0);

  function addKit() {
    if (addMany(chosen.map((option) => option.key))) {
      notify("Equipo agregado al carrito");
      openCart();
    } else {
      notify("Esos productos ya están en tu carrito");
    }
  }

  const options = (list: typeof products) =>
    list.map((p) => (
      <option key={p.slug} value={p.slug}>
        {p.name} · {money(p.options[0].price)}
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
