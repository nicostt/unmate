"use client";

import Image from "next/image";
import { useState } from "react";
import { money } from "@/lib/format";
import { cartKey, isSoldOut, type Product, type Shape } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";

// Las tres partes del equipo. `none` es el texto de "no quiero esta parte";
// el mate no lo tiene porque es obligatorio.
const STEPS = [
  { id: "mate", label: "Mate", category: "mates", none: null },
  { id: "bombilla", label: "Bombilla", category: "bombillas", none: "Sin bombilla" },
  { id: "termo", label: "Termo", category: "termos", none: "Sin termo" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Una opción para elegir: un producto, o un diseño puntual de un mate.
type Option = {
  key: string; // lo que va al carrito
  name: string;
  price: number;
  image: string | null;
  shape: Shape;
  unique: boolean; // es una pieza única (un diseño)
};

// Opciones de una categoría: una por producto, o una por cada diseño si el
// producto va por diseños (así el cliente elige la pieza por su foto).
function optionsOf(products: Product[], category: string): Option[] {
  return products
    .filter((p) => p.category === category && !isSoldOut(p))
    .flatMap((p): Option[] =>
      p.byDesign
        ? p.designs.map((d) => ({
            key: cartKey(p, d),
            name: p.name,
            price: p.price,
            image: d.images[0],
            shape: p.shape,
            unique: true,
          }))
        : [{ key: cartKey(p, null), name: p.name, price: p.price, image: p.images[0] ?? null, shape: p.shape, unique: false }],
    );
}

// "Armá tu equipo": se eligen mate, bombilla y termo viendo la foto de cada
// uno, y se suman juntos al carrito. Cada parte tiene su pestaña.
export function KitBuilder() {
  const { products, addMany, openCart, notify } = useShop();
  const options: Record<StepId, Option[]> = {
    mate: optionsOf(products, "mates"),
    bombilla: optionsOf(products, "bombillas"),
    termo: optionsOf(products, "termos"),
  };

  const [step, setStep] = useState<StepId>("mate");
  // qué se eligió en cada parte (key de la opción); null = ninguna
  const [picked, setPicked] = useState<Record<StepId, string | null>>({ mate: null, bombilla: null, termo: null });

  // si lo elegido dejó de existir (se vendió), esa parte queda sin elegir
  const chosen = (id: StepId) => options[id].find((o) => o.key === picked[id]) ?? null;
  const all = STEPS.map((s) => chosen(s.id)).filter((o) => o !== null);
  const total = all.reduce((sum, o) => sum + o.price, 0);
  const current = STEPS.find((s) => s.id === step)!;

  function addKit() {
    if (!all.length) return notify("Elegí al menos un mate para armar tu equipo");
    if (addMany(all.map((o) => o.key))) {
      notify("Equipo agregado al carrito");
      openCart();
    } else {
      notify("Esos productos ya están en tu carrito");
    }
  }

  return (
    <section className="wrap block" id="equipo">
      <div className="kit">
        <div className="kit-intro">
          <p className="eyebrow">Combo a tu medida</p>
          <h2>Armá tu equipo</h2>
          <p className="muted">Elegí mate, bombilla y termo mirando cada uno, y sumalo todo al carrito de una vez.</p>
        </div>

        <div className="kit-tabs" role="tablist" aria-label="Partes del equipo">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className="kit-tab"
              type="button"
              role="tab"
              aria-selected={step === s.id}
              onClick={() => setStep(s.id)}
            >
              <span className="kit-tab-n">{i + 1}</span>
              <span>
                <strong>{s.label}</strong>
                <small>{chosen(s.id)?.name ?? (picked[s.id] === null && s.none ? s.none : "Sin elegir")}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="kit-options" role="tabpanel" aria-label={current.label}>
          {current.none && (
            <button
              className="kit-option is-none"
              type="button"
              aria-pressed={picked[step] === null}
              onClick={() => setPicked({ ...picked, [step]: null })}
            >
              <span className="kit-option-art">—</span>
              <strong>{current.none}</strong>
            </button>
          )}
          {options[step].map((option) => (
            <button
              key={option.key}
              className="kit-option"
              type="button"
              aria-pressed={picked[step] === option.key}
              onClick={() => setPicked({ ...picked, [step]: option.key })}
            >
              <span className="kit-option-art">
                {option.image ? (
                  <Image src={option.image} alt="" fill sizes="160px" />
                ) : (
                  <ProductArt shape={option.shape} />
                )}
              </span>
              <strong>{option.name}</strong>
              <small>
                {money(option.price)}
                {option.unique && " · pieza única"}
              </small>
            </button>
          ))}
          {options[step].length === 0 && <p className="muted">Por ahora no hay {current.label.toLowerCase()}s disponibles.</p>}
        </div>

        <div className="kit-foot">
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
