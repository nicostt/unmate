import { useLayoutEffect, useRef } from "react";
import { reducedMotion } from "@/lib/motion";

const EASING = "cubic-bezier(.2,.8,.2,1)";

// Animación "FLIP" para una lista que cambia (filtrar, buscar, ordenar): en
// vez de saltar a su lugar nuevo, cada elemento se desliza desde donde
// estaba, y los que recién aparecen entran con un fundido.
//
// Cómo se usa:
//  - `ref` va en el contenedor;
//  - cada elemento a animar lleva data-flip="<algo único>";
//  - se llama a `snapshot()` justo ANTES de cambiar lo que se muestra.
//
// El truco (First, Last, Invert, Play): se anota dónde estaba cada uno, se
// deja que la página se acomode, se mide dónde quedó, y se lo anima desde la
// posición vieja hasta la nueva.
export function useFlip<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);

  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>("[data-flip]") ?? [])];

  function snapshot() {
    if (reducedMotion()) return;
    before.current = new Map(items().map((el) => [el.dataset.flip!, el.getBoundingClientRect()]));
  }

  // Sin lista de dependencias: corre después de cada dibujo, pero solo hace
  // algo si antes se llamó a snapshot().
  useLayoutEffect(() => {
    const first = before.current;
    if (!first) return;
    before.current = null;
    for (const el of items()) {
      // si venía moviéndose por un cambio anterior, se corta para medir bien
      el.getAnimations().forEach((a) => a.id === "flip" && a.cancel());
      const was = first.get(el.dataset.flip!);
      const now = el.getBoundingClientRect();
      let animation: Animation | undefined;
      if (!was) {
        animation = el.animate(
          [
            { opacity: 0, transform: "scale(.92)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, easing: EASING },
        );
      } else if (was.left !== now.left || was.top !== now.top) {
        animation = el.animate(
          [{ transform: `translate(${was.left - now.left}px, ${was.top - now.top}px)` }, { transform: "none" }],
          { duration: 450, easing: EASING },
        );
      }
      if (animation) animation.id = "flip";
    }
  });

  return { ref, snapshot };
}
