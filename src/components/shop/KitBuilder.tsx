"use client";

import Image from "next/image";
import { useState } from "react";
import { money } from "@/lib/format";
import { cartKey, isSoldOut, kitSaving, type Product, type Shape } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Las cuatro partes del equipo (las mismas de KIT_PARTS, en src/lib/types.ts,
// que es lo que usa el descuento). `none` es el texto de "no quiero esta
// parte"; el mate no lo tiene porque es obligatorio. `art` es el dibujo que
// muestra el casillero mientras no se eligió nada.
const STEPS = [
  { id: "mate", label: "Mate", category: "mates", none: null, art: "camionero" },
  { id: "bombilla", label: "Bombilla", category: "bombillas", none: "Sin bombilla", art: "loro" },
  { id: "termo", label: "Termo", category: "termos", none: "Sin termo", art: "termo" },
  { id: "yerba", label: "Yerba", category: "yerba", none: "Sin yerba", art: "yerba" },
] as const;

type Step = (typeof STEPS)[number];
type StepId = Step["id"];

// Una opción para elegir: un producto, o un diseño puntual de un mate.
type Option = {
  key: string; // lo que va al carrito
  product: Product;
  name: string;
  price: number;
  image: string | null;
  shape: Shape;
  unique: boolean; // es una pieza única (un diseño)
};

// Opciones de una categoría: una por producto, o una por cada diseño si el
// producto va por diseños (así el cliente elige la pieza por su foto).
// La yerba suelta no entra: al equipo va el paquete.
function optionsOf(products: Product[], category: string): Option[] {
  return products
    .filter((p) => p.category === category && !p.byWeight && !isSoldOut(p))
    .flatMap((p): Option[] =>
      p.byDesign
        ? p.designs.map((d) => ({
            key: cartKey(p, d),
            product: p,
            name: p.name,
            price: p.price,
            image: d.images[0],
            shape: p.shape,
            unique: true,
          }))
        : [
            {
              key: cartKey(p, null),
              product: p,
              name: p.name,
              price: p.price,
              image: p.images[0] ?? null,
              shape: p.shape,
              unique: false,
            },
          ],
    );
}

function OptionArt({ option }: { option: Option }) {
  return option.image ? <Image src={option.image} alt="" fill sizes="180px" /> : <ProductArt shape={option.shape} />;
}

// "Armá tu equipo": cuatro casilleros (mate, bombilla, termo y yerba). Al tocar uno se
// abre una ventana encima de la página con las fotos de todas las opciones;
// se elige una y la ventana se cierra. Así la sección ocupa lo mismo haya 5
// mates o 50.
export function KitBuilder() {
  const { products, kit, addMany, openCart, notify } = useShop();
  const options = Object.fromEntries(STEPS.map((s) => [s.id, optionsOf(products, s.category)])) as Record<
    StepId,
    Option[]
  >;

  const [open, setOpen] = useState<Step | null>(null); // qué ventana está abierta
  // qué se eligió en cada parte (key de la opción); null = ninguna
  const [picked, setPicked] = useState<Record<StepId, string | null>>({
    mate: null,
    bombilla: null,
    termo: null,
    yerba: null,
  });

  // si lo elegido dejó de existir (se vendió), esa parte queda sin elegir
  const chosen = (id: StepId) => options[id].find((o) => o.key === picked[id]) ?? null;
  const all = STEPS.map((s) => chosen(s.id)).filter((o) => o !== null);
  const subtotal = all.reduce((sum, o) => sum + o.price, 0);
  // descuento por armar equipo: misma cuenta que hace después el carrito
  const saving = kitSaving(all.map((o) => o.product), kit).amount;
  const total = subtotal - saving;

  function addKit() {
    if (!all.length) return notify("Elegí al menos un mate para armar tu equipo");
    if (addMany(all.map((o) => o.key))) {
      notify("¡Equipo armado! Ya está en tu carrito");
      openCart();
    } else {
      notify("Esos productos ya están en tu carrito");
    }
  }

  return (
    <section className="wrap block" id="equipo" data-reveal>
      <div className="kit grain">
        <div className="kit-intro">
          <p className="eyebrow">Combo a tu medida</p>
          <h2>Armá tu equipo</h2>
          <p className="muted">Tocá cada parte, elegí la que te guste mirando las fotos y sumá todo al carrito de una vez.</p>
          {kit && (
            <p className="kit-offer">
              <span className="off">−{kit.percent}%</span>
              Llevando {kit.min === STEPS.length ? `las ${kit.min} partes` : `${kit.min} partes o más`}, el equipo te sale
              más barato.
            </p>
          )}
        </div>

        <div className="kit-slots">
          {STEPS.map((step) => {
            const option = chosen(step.id);
            return (
              <button key={step.id} className="kit-slot" type="button" aria-haspopup="dialog" onClick={() => setOpen(step)}>
                <span className={option ? "kit-slot-art" : "kit-slot-art is-empty"}>
                  {option ? <OptionArt option={option} /> : <ProductArt shape={step.art} />}
                </span>
                <span className="kit-slot-text">
                  <small>{step.label}</small>
                  <strong>{option?.name ?? (step.none ?? "Elegí tu mate")}</strong>
                  <small>{option ? money(option.price) : "Tocá para elegir →"}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="kit-foot">
          <div className="kit-total">
            <span className="muted">Total del equipo</span>
            {saving > 0 && <s className="was">{money(subtotal)}</s>}
            <strong>{money(total)}</strong>
            {saving > 0 && kit && <span className="off">−{kit.percent}%</span>}
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

// Cuánto dura la salida de la ventana (igual que en src/styles/overlays.css).
const PICKER_EXIT_MS = 200;

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
  // Al cerrarla (o al elegir) no desaparece de golpe: primero se va con su
  // animación (clase "is-closing") y recién después se avisa.
  const [closing, setClosing] = useState(false);
  function leave(then: () => void) {
    if (closing) return;
    setClosing(true);
    setTimeout(then, PICKER_EXIT_MS);
  }
  useOverlay(true, () => leave(onClose));

  return (
    <div
      className={closing ? "modal is-closing" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kit-picker-title"
      // clic en el fondo oscuro = cerrar sin cambiar nada
      onClick={(e) => e.target === e.currentTarget && leave(onClose)}
    >
      <div className="modal-card kit-picker">
        <button className="icon-btn" type="button" onClick={() => leave(onClose)} aria-label="Cerrar" autoFocus>
          ×
        </button>
        <h3 id="kit-picker-title">Elegí tu {step.label.toLowerCase()}</h3>
        <div className="kit-options">
          {step.none && (
            <button className="kit-option is-none" type="button" aria-pressed={picked === null} onClick={() => leave(() => onPick(null))}>
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
              onClick={() => leave(() => onPick(option.key))}
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
