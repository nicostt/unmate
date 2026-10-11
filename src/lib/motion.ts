// Ayudas para las animaciones que se manejan desde JavaScript.

// ¿La persona pidió menos movimiento en su dispositivo? En ese caso los
// movimientos grandes se cambian por fundidos suaves (ver src/styles/motion.css).
export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Hace un cambio de pantalla animando el paso de lo viejo a lo nuevo con la
// View Transitions API: el navegador saca una "foto" de antes y otra de
// después, y las funde (o mueve de un lugar a otro lo que tenga el mismo
// view-transition-name).
//  - `update` tiene que cambiar la página en el momento (en React: flushSync).
//  - `done` corre cuando la animación terminó.
// Si el navegador no la tiene, el cambio se hace igual, sin animación.
export function viewTransition(update: () => void, done?: () => void): ViewTransition | null {
  if (typeof document.startViewTransition !== "function") {
    update();
    done?.();
    return null;
  }
  const transition = document.startViewTransition(update);
  // `ready` falla si el navegador decide saltearse la animación: no es un error
  transition.ready.catch(() => {});
  transition.finished.catch(() => {}).then(() => done?.());
  return transition;
}
