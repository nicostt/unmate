"use client";

import { useEffect, useRef, useState } from "react";
import { ProductArt } from "@/components/shop/ProductArt";
import type { Shape } from "@/lib/types";

// Tipos de mate de la guía. Para sumar o cambiar uno, se edita esta lista.
// `shape` es el dibujo que se muestra mientras no haya una foto real.
// PENDIENTE: Nicolás pasa los textos definitivos y las fotos de cada tipo.
const TYPES: { name: string; text: string; shape: Shape }[] = [
  {
    name: "Camionero",
    text: "De forma robusta y práctica, pensado para el uso de todos los días y para llevar.",
    shape: "camionero",
  },
  { name: "Torpedo", text: "De forma alargada y más angosta hacia la base.", shape: "torpedo" },
  { name: "Imperial", text: "El clásico de boca ancha y cuerpo redondeado.", shape: "imperial" },
  { name: "Calabaza", text: "Material natural. Antes de usarlo hay que curarlo.", shape: "criollo" },
  { name: "Algarrobo", text: "Madera. También se cura antes del primer mate.", shape: "ranchero" },
  {
    name: "Bombillón",
    text: "Versión más grande de la bombilla, para acompañar mates de más volumen.",
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
