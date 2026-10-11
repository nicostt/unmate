import { useLayoutEffect, useRef } from "react";
import { reducedMotion } from "@/lib/motion";

const EASING = "cubic-bezier(.2,.8,.2,1)";
const EXIT_MS = 260;

// Animación "FLIP" para una lista que cambia (filtrar, buscar, ordenar,
// quitar un renglón): nada salta de golpe.
//  - lo que sigue estando se desliza desde donde estaba hasta su lugar nuevo;
//  - lo que recién aparece entra con un fundido;
//  - lo que se va se achica y se desvanece antes de desaparecer.
//
// Cómo se usa:
//  - `ref` va en el contenedor;
//  - cada elemento a animar lleva data-flip="<algo único>";
//  - se llama a `snapshot()` justo ANTES de cambiar lo que se muestra.
//
// El truco (First, Last, Invert, Play): se anota dónde estaba cada uno, se
// deja que la página se acomode, se mide dónde quedó, y se lo anima desde la
// posición vieja hasta la nueva.
//
// `ghostZ`: a qué altura (z-index) se dibuja lo que se está yendo. Tiene que
// quedar por encima del contenedor.
export function useFlip<T extends HTMLElement>(ghostZ = 1) {
  const ref = useRef<T>(null);
  // la "foto" de antes del cambio: dónde estaba cada elemento, y qué parte del contenedor se veía
  const before = useRef<{ items: Map<string, { box: DOMRect; el: HTMLElement }>; top: number; bottom: number } | null>(
    null,
  );

  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>("[data-flip]") ?? [])];

  function snapshot() {
    const container = ref.current;
    if (!container || reducedMotion()) return;
    const area = container.getBoundingClientRect();
    before.current = {
      items: new Map(items().map((el) => [el.dataset.flip!, { box: el.getBoundingClientRect(), el }])),
      // lo que se veía: el contenedor, recortado a la pantalla
      top: Math.max(area.top, 0),
      bottom: Math.min(area.bottom, window.innerHeight),
    };
  }

  // Sin lista de dependencias: corre después de cada dibujo, pero solo hace
  // algo si antes se llamó a snapshot().
  useLayoutEffect(() => {
    const snap = before.current;
    if (!snap) return;
    before.current = null;
    const first = snap.items;

    const now = items();
    const present = new Set(now.map((el) => el.dataset.flip));

    for (const el of now) {
      // si venía moviéndose por un cambio anterior, se corta para medir bien
      el.getAnimations().forEach((a) => a.id === "flip" && a.cancel());
      const was = first.get(el.dataset.flip!)?.box;
      const box = el.getBoundingClientRect();
      let animation: Animation | undefined;
      if (!was) {
        animation = el.animate(
          [
            { opacity: 0, transform: "scale(.92)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, easing: EASING },
        );
      } else if (was.left !== box.left || was.top !== box.top) {
        animation = el.animate(
          [{ transform: `translate(${was.left - box.left}px, ${was.top - box.top}px)` }, { transform: "none" }],
          { duration: 450, easing: EASING },
        );
      }
      if (animation) animation.id = "flip";
    }

    // Los que se fueron: React ya los sacó de la página, pero el elemento
    // sigue existiendo. Se lo vuelve a poner un instante, fijo en el lugar
    // donde estaba, para que se despida en vez de esfumarse.
    for (const [key, { box, el }] of first) {
      if (present.has(key) || el.isConnected) continue;
      if (box.bottom < snap.top || box.top > snap.bottom) continue; // no se estaba viendo
      el.inert = true; // ya no se puede tocar ni enfocar
      Object.assign(el.style, {
        position: "fixed",
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        margin: "0",
        zIndex: String(ghostZ),
        pointerEvents: "none",
      });
      document.body.append(el);
      const remove = () => el.remove();
      el.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "scale(.92)" },
        ],
        { duration: EXIT_MS, easing: "ease-in", fill: "forwards" },
      ).onfinish = remove;
      setTimeout(remove, EXIT_MS + 200); // por si la animación no llega a terminar (pestaña en segundo plano)
    }
  });

  return { ref, snapshot };
}
