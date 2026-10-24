"use client";

import { useEffect, useRef, useState } from "react";
import { ProductArt } from "@/components/shop/ProductArt";
import type { Shape } from "@/lib/types";

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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
