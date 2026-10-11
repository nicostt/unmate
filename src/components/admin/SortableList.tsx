"use client";

import { useRef } from "react";

// Lista que se ordena arrastrando. Cada fila tiene que traer adentro una
// manija con la clase "admin-grip": se la agarra, se lleva la fila a otra
// posición y las demás se corren para hacerle lugar.
//
// Mientras se arrastra no se toca el orden real: la fila agarrada sigue al
// puntero y las vecinas se corren con `transform`. Recién al soltar se avisa
// con `onMove(desde, hasta)`, que es quien guarda el orden nuevo.
//
// Con el teclado: enfocar la manija y usar las flechas ↑ ↓.
export function SortableList({
  children,
  onMove,
}: {
  children: React.ReactNode;
  onMove: (from: number, to: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    rows: HTMLElement[];
    from: number;
    to: number;
    y0: number;
    middles: number[]; // punto medio de cada fila al empezar
    step: number; // cuánto se corre una vecina: el alto de la fila agarrada más la separación
  } | null>(null);

  const rowsOf = () => [...(list.current?.children ?? [])] as HTMLElement[];

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const grip = (e.target as HTMLElement).closest<HTMLElement>(".admin-grip");
    if (!grip || !list.current) return;
    const rows = rowsOf();
    const from = rows.findIndex((row) => row.contains(grip));
    if (from < 0) return;
    e.preventDefault();
    try {
      grip.setPointerCapture(e.pointerId);
    } catch {
      // sin captura el arrastre funciona igual mientras el puntero no salga de la lista
    }
    const boxes = rows.map((row) => row.getBoundingClientRect());
    const gap = rows.length > 1 ? boxes[1].top - boxes[0].bottom : 0;
    drag.current = {
      rows,
      from,
      to: from,
      y0: e.clientY,
      middles: boxes.map((box) => box.top + box.height / 2),
      step: boxes[from].height + gap,
    };
    rows[from].classList.add("is-dragging");
    list.current.classList.add("is-sorting");
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y0;
    d.rows[d.from].style.transform = `translateY(${dy}px)`;

    // a qué posición iría si se soltara ahora: pasa a una vecina cuando el
    // centro de la fila agarrada cruza el centro de esa vecina
    const center = d.middles[d.from] + dy;
    let to = d.from;
    d.middles.forEach((middle, i) => {
      if (i > d.from && center > middle) to = Math.max(to, i);
      if (i < d.from && center < middle) to = Math.min(to, i);
    });
    d.to = to;

    // las que quedan entre el lugar viejo y el nuevo se corren un lugar
    d.rows.forEach((row, i) => {
      if (i === d.from) return;
      const shift = i > d.from && i <= to ? -d.step : i < d.from && i >= to ? d.step : 0;
      row.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    list.current?.classList.remove("is-sorting");
    d.rows.forEach((row) => {
      row.classList.remove("is-dragging");
      row.style.transform = "";
    });
    if (d.to !== d.from) onMove(d.from, d.to);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const grip = (e.target as HTMLElement).closest<HTMLElement>(".admin-grip");
    if (!grip || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const rows = rowsOf();
    const from = rows.findIndex((row) => row.contains(grip));
    const to = from + (e.key === "ArrowUp" ? -1 : 1);
    if (from < 0 || to < 0 || to >= rows.length) return;
    onMove(from, to);
  }

  return (
    <div
      className="admin-list"
      ref={list}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
