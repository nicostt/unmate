import { useEffect, useEffectEvent } from "react";

// Comportamiento común del carrito y de la ficha de producto mientras están
// abiertos: la página de atrás no scrollea, Escape cierra, y al cerrar el
// foco del teclado vuelve al botón que los abrió.
export function useOverlay(open: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [open]);
}
