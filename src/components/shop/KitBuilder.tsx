"use client";

import Image from "next/image";
import { useState } from "react";
import { money } from "@/lib/format";
import { cartKey, isSoldOut, type Product, type Shape } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Las tres partes del equipo. `none` es el texto de "no quiero esta parte";
// el mate no lo tiene porque es obligatorio.
const STEPS = [
  { id: "mate", label: "Mate", category: "mates", none: null },
  { id: "bombilla", label: "Bombilla", category: "bombillas", none: "Sin bombilla" },
  { id: "termo", label: "Termo", category: "termos", none: "Sin termo" },
] as const;

type Step = (typeof STEPS)[number];
type StepId = Step["id"];

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

function OptionArt({ option }: { option: Option }) {
  return option.image ? <Image src={option.image} alt="" fill sizes="180px" /> : <ProductArt shape={option.shape} />;
}

// "Armá tu equipo": tres casilleros (mate, bombilla, termo). Al tocar uno se
// abre una ventana encima de la página con las fotos de todas las opciones;
// se elige una y la ventana se cierra. Así la sección ocupa lo mismo haya 5
// mates o 50.
export function KitBuilder() {
  const { products, addMany, openCart, notify } = useShop();
  const options: Record<StepId, Option[]> = {
    mate: optionsOf(products, "mates"),
    bombilla: optionsOf(products, "bombillas"),
    termo: optionsOf(products, "termos"),
  };

  const [open, setOpen] = useState<Step | null>(null); // qué ventana está abierta
  // qué se eligió en cada parte (key de la opción); null = ninguna
  const [picked, setPicked] = useState<Record<StepId, string | null>>({ mate: null, bombilla: null, termo: null });

  // si lo elegido dejó de existir (se vendió), esa parte queda sin elegir
  const chosen = (id: StepId) => options[id].find((o) => o.key === picked[id]) ?? null;
  const all = STEPS.map((s) => chosen(s.id)).filter((o) => o !== null);
  const total = all.reduce((sum, o) => sum + o.price, 0);

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
    <section className="wrap block" id="equipo" data-reveal>
      <div className="kit">
        <div className="kit-intro">
          <p className="eyebrow">Combo a tu medida</p>
          <h2>Armá tu equipo</h2>
          <p className="muted">Tocá cada parte, elegí la que te guste mirando las fotos y sumá todo al carrito de una vez.</p>
        </div>

        <div className="kit-slots">
          {STEPS.map((step, i) => {
            const option = chosen(step.id);
            return (
              <button key={step.id} className="kit-slot" type="button" aria-haspopup="dialog" onClick={() => setOpen(step)}>
                <span className="kit-slot-art">{option ? <OptionArt option={option} /> : <span>{i + 1}</span>}</span>
                <span className="kit-slot-text">
                  <small>{step.label}</small>
                  <strong>{option?.name ?? (step.none ?? "Elegí tu mate")}</strong>
                  <small>{option ? money(option.price) : "Tocá para elegir"}</small>
                </span>
              </button>
            );
          })}
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

      {open && (
        <KitPicker
          step={open}
          options={options[open.id]}
          picked={chosen(open.id)?.key ?? null}
          onPick={(key) => {
            setPicked({ ...picked, [open.id]: key });
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

// Ventana para elegir una parte del equipo, con la foto de cada opción.
function KitPicker({
  step,
  options,
  picked,
  onPick,
  onClose,
}: {
  step: Step;
  options: Option[];
  picked: string | null;
  onPick: (key: string | null) => void;
  onClose: () => void;
}) {
  useOverlay(true, onClose);

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kit-picker-title"
      // clic en el fondo oscuro = cerrar sin cambiar nada
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card kit-picker">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
          ×
        </button>
        <h3 id="kit-picker-title">Elegí tu {step.label.toLowerCase()}</h3>
        <div className="kit-options">
          {step.none && (
            <button className="kit-option is-none" type="button" aria-pressed={picked === null} onClick={() => onPick(null)}>
              <span className="kit-option-art">—</span>
              <strong>{step.none}</strong>
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.key}
              className="kit-option"
              type="button"
              aria-pressed={picked === option.key}
              onClick={() => onPick(option.key)}
            >
              <span className="kit-option-art">
                <OptionArt option={option} />
              </span>
              <strong>{option.name}</strong>
              <small>
                {money(option.price)}
                {option.unique && " · pieza única"}
              </small>
            </button>
          ))}
          {options.length === 0 && <p className="muted">Por ahora no hay {step.label.toLowerCase()}s disponibles.</p>}
        </div>
      </div>
    </div>
  );
}
