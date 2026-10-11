import { useEffect, useState } from "react";

// Mantiene algo en pantalla un rato después de cerrarlo, para que pueda irse
// con una animación en vez de desaparecer de golpe.
//
//   const { shown, closing } = usePresence(open, 260);
//   if (!shown) return null;
//   <div className={closing ? "panel is-closing" : "panel"}>
//
// `ms` tiene que durar lo mismo que la animación de salida del CSS (la que
// se activa con la clase "is-closing").
export function usePresence(open: boolean, ms: number): { shown: boolean; closing: boolean } {
  const [shown, setShown] = useState(open);
  // Se abrió: aparece ya mismo. (Ajustar el estado mientras se dibuja es la
  // forma que recomienda React para seguir un dato que viene de afuera.)
  if (open && !shown) setShown(true);

  // Se cerró: se queda lo que dure la salida y recién ahí se saca.
  useEffect(() => {
    if (open || !shown) return;
    const timer = setTimeout(() => setShown(false), ms);
    return () => clearTimeout(timer);
  }, [open, shown, ms]);

  return { shown, closing: shown && !open };
}
