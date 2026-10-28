"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProductArt } from "@/components/shop/ProductArt";
import { useShop } from "@/components/shop/ShopProvider";
import { useOverlay } from "@/components/shop/useOverlay";
import { usePresence } from "@/components/shop/usePresence";
import { money } from "@/lib/format";
import { coverImages, isSoldOut, PRODUCT_TYPES, type Product, type Shape } from "@/lib/types";

// Cuánto dura la salida de la ventana: igual que .modal.is-closing (overlays.css).
const EXIT_MS = 260;

// Qué tipo de producto (PRODUCT_TYPES, se marca en el panel) corresponde a
// cada nombre de la lista: son los mismos nombres.
const typeKey = (name: string) => PRODUCT_TYPES.find((t) => t.label === name)?.key;

// Tipos de mate de la guía. Para sumar o cambiar uno, se edita esta lista.
// Los textos son de Emanuel (24/10/2026): van con sus palabras, solo con
// tildes y puntos. `shape` es el dibujo que se muestra mientras no haya una
// foto real (no hay dibujo propio para el acero ni para la bombilla común).
const TYPES: { name: string; text: string; shape: Shape }[] = [
  {
    name: "Calabaza",
    text: "Si buscás amargor, tradición y mejor sabor en el tiempo. Necesita más atención y cuidado. Necesita curado.",
    shape: "criollo",
  },
  {
    name: "Algarrobo",
    text: "Si buscás un sabor más neutro/dulce en cada cebada. Menor cuidado en relación a la calabaza. Necesita curado.",
    shape: "ranchero",
  },
  {
    name: "Acero",
    text: "Fácil limpieza, no necesita cuidado. No modifica el sabor de la Yerba Mate.",
    shape: "camionero",
  },
  {
    name: "Camionero",
    text: "Capacidad mediana a grande, cuerpo alargado con boca ancha. El mate tradicional.",
    shape: "camionero",
  },
  {
    name: "Torpedo",
    text: "Capacidad chica a mediana, las bocas varían en estilo, cuerpo con forma de bala o torpedo.",
    shape: "torpedo",
  },
  {
    name: "Imperial",
    text: "Capacidad mediana a grande, es el modelo de lujo con boca ancha.",
    shape: "imperial",
  },
  {
    name: "Bombilla",
    text: "Es el sorbete clásico fino y alargado comúnmente de acero inoxidable.",
    shape: "loro",
  },
  {
    name: "Bombillón",
    text: "Es la versión premium de la bombilla, en su mayoría de alpaca y bronce, mejor sensación y materiales más nobles.",
    shape: "bombillon",
  },
];

// Lista de tipos de mate: se ve solo el nombre. Al pasar el mouse se abre
// con su dibujo y su descripción; al hacer clic queda fijo, hasta tocar otro
// tipo o cualquier lugar fuera de la lista.
export function MateTypes() {
  const { products, showProduct } = useShop();
  // "Ver en catálogo": qué tipo se está mirando en la ventana (null = cerrada)
  const [browsing, setBrowsing] = useState<string | null>(null);
  const ofType = (name: string) => {
    const key = typeKey(name);
    return key ? products.filter((p) => p.types.includes(key)) : [];
  };
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const open = pinned ?? hovered;

  // Con uno fijo, un clic fuera de la lista lo suelta.
  useEffect(() => {
    if (!pinned) return;
    const release = (e: MouseEvent) => {
      if (!list.current?.contains(e.target as Node)) setPinned(null);
    };
    document.addEventListener("click", release);
    return () => document.removeEventListener("click", release);
  }, [pinned]);

  return (
    <>
    <ul className="types" ref={list} onMouseLeave={() => setHovered(null)}>
      {TYPES.map((type) => {
        const isOpen = open === type.name;
        return (
          <li key={type.name} className={isOpen ? "is-open" : undefined} onMouseEnter={() => setHovered(type.name)}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-pressed={pinned === type.name}
              onClick={() => setPinned(pinned === type.name ? null : type.name)}
            >
              {type.name}
            </button>
            <div className="types-body">
              <div className="types-art">
                <ProductArt shape={type.shape} />
              </div>
              <p>{type.text}</p>
              {/* si todavía no hay productos de este tipo, no aparece */}
              {ofType(type.name).length > 0 && (
                <button className="btn ghost small types-see" type="button" onClick={() => setBrowsing(type.name)}>
                  Ver en catálogo →
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
    <TypePicker
      title={browsing}
      products={browsing ? ofType(browsing) : []}
      onClose={() => setBrowsing(null)}
      onPick={(slug) => {
        setBrowsing(null);
        showProduct(slug);
      }}
    />
    </>
  );
}

// Ventana con los productos de un tipo, igual a la de "Armá tu equipo"
// (clases kit-picker y kit-option de sections.css). Al tocar uno se cierra y
// se abre su ficha.
function TypePicker({
  title,
  products,
  onClose,
  onPick,
}: {
  title: string | null;
  products: Product[];
  onClose: () => void;
  onPick: (slug: string) => void;
}) {
  const open = title !== null;
  const { shown, closing } = usePresence(open, EXIT_MS);
  // lo último que se mostró, para que se vea mientras la ventana se va
  const [last, setLast] = useState({ title, products });
  if (open && title !== last.title) setLast({ title, products });
  useOverlay(open, onClose);
  if (!shown) return null;
  const view = open ? { title, products } : last;

  // va directo al <body>: adentro de la sección quedaría encerrada por la
  // animación de aparecer al bajar (data-reveal)
  return createPortal(
    <div
      className={closing ? "modal is-closing" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="type-picker-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card kit-picker">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
          ×
        </button>
        <h3 id="type-picker-title">{view.title}</h3>
        <div className="kit-options">
          {view.products.map((product) => {
            const photo = coverImages(product)[0];
            return (
              <button key={product.slug} className="kit-option" type="button" onClick={() => onPick(product.slug)}>
                <span className="kit-option-art">
                  {photo ? <Image src={photo} alt="" fill sizes="160px" /> : <ProductArt shape={product.shape} />}
                </span>
                <strong>{product.name}</strong>
                <small>{isSoldOut(product) ? "Agotado" : money(product.price)}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
