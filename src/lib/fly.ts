import { reducedMotion } from "./motion";

// "El producto vuela al carrito": al agregar algo desde una tarjeta, una
// miniatura viaja en curva hasta el botón del carrito, que rebota al
// recibirla. Así se ve dónde quedó lo que se agregó.

const SIZE = 56; // lado de la miniatura, en px
const DURATION = 760; // ms

// Rebote del botón del carrito.
export function bumpCart() {
  const cart = document.querySelector<HTMLElement>(".cart-btn");
  if (!cart) return;
  cart.classList.remove("bump");
  void cart.offsetWidth; // obliga al navegador a "olvidar" la animación anterior
  cart.classList.add("bump");
}

// `from`: desde dónde sale (la foto de la tarjeta). `image`: qué foto lleva;
// null = un círculo del color de marca.
export function flyToCart(from: Element | null, image: string | null) {
  const cart = document.querySelector<HTMLElement>(".cart-btn");
  const header = document.querySelector<HTMLElement>(".top");
  if (!cart) return;

  // si el encabezado estaba escondido, vuelve: es a donde va el producto
  const hidden = header?.classList.contains("is-away") ?? false;
  header?.classList.remove("is-away");

  if (!from || reducedMotion()) return bumpCart();

  const a = from.getBoundingClientRect();
  const b = cart.getBoundingClientRect();
  const startX = a.left + a.width / 2 - SIZE / 2;
  const startY = a.top + a.height / 2 - SIZE / 2;
  const dx = b.left + b.width / 2 - SIZE / 2 - startX;
  // escondido, el botón está corrido hacia arriba el alto del encabezado
  const dy = b.top + (hidden ? (header?.offsetHeight ?? 0) : 0) + b.height / 2 - SIZE / 2 - startY;

  // Tres capas, una adentro de otra: la de afuera se mueve en X a ritmo
  // parejo, la del medio en Y (primero sube y después cae) y la de adentro
  // se achica. La suma de las tres dibuja la curva.
  const moveX = document.createElement("div");
  const moveY = document.createElement("div");
  const ghost = document.createElement("div");
  moveX.className = "fly";
  moveX.style.left = `${startX}px`;
  moveX.style.top = `${startY}px`;
  ghost.className = "fly-ghost";
  if (image) ghost.style.backgroundImage = `url("${image}")`;
  moveY.append(ghost);
  moveX.append(moveY);
  document.body.append(moveX);

  const lift = Math.min(70, Math.abs(dy) * 0.3 + 30);
  moveX.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration: DURATION,
    easing: "cubic-bezier(.4,0,.6,1)",
    fill: "forwards",
  });
  moveY.animate(
    [
      { transform: "translateY(0)", easing: "cubic-bezier(.2,.6,.4,1)" },
      { transform: `translateY(${Math.min(dy, 0) - lift}px)`, offset: 0.45, easing: "cubic-bezier(.6,0,.8,.4)" },
      { transform: `translateY(${dy}px)` },
    ],
    { duration: DURATION, fill: "forwards" },
  );
  const shrink = ghost.animate(
    [{ transform: "scale(1)" }, { transform: "scale(.9)", offset: 0.5 }, { transform: "scale(.3)", opacity: 0.5 }],
    { duration: DURATION, fill: "forwards" },
  );
  const land = () => {
    moveX.remove();
    bumpCart();
  };
  shrink.onfinish = land;
  shrink.oncancel = land;
}
