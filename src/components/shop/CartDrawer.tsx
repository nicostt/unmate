"use client";

import Image from "next/image";
import { WhatsAppIcon } from "@/components/site/BrandIcons";
import { useRef, useState } from "react";
import { money } from "@/lib/format";
import { createOrder } from "@/lib/orders";
import { orderMessage, whatsappLink } from "@/lib/site";
import { KIT_PARTS, lineTotal, productLabel, weightLabel, type KitPart } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// En el celular el carrito es una "hoja" que sube desde abajo. Tiene dos
// alturas, como porción del alto de la pantalla: a medias y completa.
const SHEET_HALF = 0.74;
const SHEET_FULL = 0.94;
// Velocidad (px por milisegundo) a partir de la cual un arrastre cuenta como
// "tirón": manda la dirección del gesto y no dónde quedó la hoja.
const FLICK = 0.6;

const isSheet = () => matchMedia("(max-width: 700px)").matches;

// Cómo se nombra cada parte del equipo al invitar a sumarla.
const PART_NAME: Record<KitPart["id"], string> = {
  mate: "un mate",
  bombilla: "una bombilla",
  termo: "un termo",
  yerba: "un paquete de yerba",
};

// Carrito. En compu es un panel que entra desde la derecha; en el celular,
// una hoja que sube desde abajo y se arrastra de la manija para agrandarla o
// cerrarla. El botón final registra el pedido en la base y abre WhatsApp con
// el pedido ya escrito.
export function CartDrawer() {
  const { lines, subtotal, total, kit, saving, add, decrement, remove, clear, notify, cartOpen, closeCart } =
    useShop();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  useOverlay(cartOpen, closeCart);

  // --- hoja del celular: arrastrar de la manija ---
  const sheet = useRef<HTMLElement>(null);
  const drag = useRef<{ y0: number; h0: number; lastY: number; lastT: number; speed: number } | null>(null);
  // un arrastre que termina sobre la manija no tiene que contar además como un toque
  const justDragged = useRef(false);

  const setHeight = (px: number) => {
    if (sheet.current) sheet.current.style.height = `${Math.round(px)}px`;
  };

  function onDragStart(e: React.PointerEvent<HTMLElement>) {
    const el = sheet.current;
    // el botón de cerrar sigue siendo un botón, no un punto de agarre
    if (!el || !isSheet() || (e.target as HTMLElement).closest(".icon-btn")) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // algunos navegadores no dejan capturar el puntero: se arrastra igual
    }
    drag.current = { y0: e.clientY, h0: el.offsetHeight, lastY: e.clientY, lastT: performance.now(), speed: 0 };
    el.classList.add("is-dragging");
  }

  function onDragMove(e: React.PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    d.speed = (e.clientY - d.lastY) / Math.max(1, now - d.lastT); // positivo = hacia abajo
    d.lastY = e.clientY;
    d.lastT = now;
    setHeight(Math.max(60, Math.min(window.innerHeight * SHEET_FULL, d.h0 - (e.clientY - d.y0))));
  }

  function onDragEnd() {
    const d = drag.current;
    const el = sheet.current;
    if (!d || !el) return;
    drag.current = null;
    el.classList.remove("is-dragging");
    const height = el.offsetHeight;
    const half = window.innerHeight * SHEET_HALF;
    const full = window.innerHeight * SHEET_FULL;
    if (Math.abs(height - d.h0) < 4) return; // fue un toque, no un arrastre
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    if (d.speed > FLICK) return height > half ? setHeight(half) : closeCart();
    if (d.speed < -FLICK) return setHeight(full);
    // soltó despacio: va a la altura más cercana, o se cierra si quedó muy abajo
    if (height < half * 0.6) return closeCart();
    setHeight(Math.abs(height - half) < Math.abs(height - full) ? half : full);
  }

  // Con el teclado (o tocando la manija): flechas para agrandar y achicar.
  function onHandleKey(e: React.KeyboardEvent) {
    const el = sheet.current;
    if (!el || !isSheet()) return;
    const half = window.innerHeight * SHEET_HALF;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHeight(window.innerHeight * SHEET_FULL);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (el.offsetHeight > half + 4) setHeight(half);
      else closeCart();
    }
  }

  function toggleSheet() {
    const el = sheet.current;
    if (!el || !isSheet() || justDragged.current) return;
    const half = window.innerHeight * SHEET_HALF;
    setHeight(el.offsetHeight > half + 4 ? half : window.innerHeight * SHEET_FULL);
  }

  // --- mandar el pedido ---
  async function send() {
    setSending(true);
    // La pestaña se abre ya mismo, vacía: los navegadores bloquean las que se
    // abren "solas" un rato después del clic. Cuando la base responde con el
    // número de pedido, se la manda a WhatsApp.
    const tab = window.open("", "_blank");
    const result = await createOrder(lines, name, note);
    // Sin stock: el pedido no se registró. Se cierra la pestaña y se avisa,
    // en vez de mandar por WhatsApp algo que no se puede vender.
    if (result && "soldOut" in result) {
      tab?.close();
      notify(`Uy, "${result.soldOut}" se acaba de agotar. Sacalo del carrito y seguimos.`);
      setSending(false);
      return;
    }
    const orderNumber = result?.number ?? null;
    const link = whatsappLink(orderMessage(lines, total, name, note, orderNumber, saving.amount));
    if (tab) {
      tab.opener = null;
      tab.location.href = link;
    } else {
      window.location.href = link;
    }
    // Si quedó registrado, el carrito ya cumplió. Si no, se deja como está
    // para que el cliente pueda reintentar.
    if (orderNumber) {
      clear();
      closeCart();
      notify(`¡Pedido #${orderNumber} anotado! Tocá enviar en WhatsApp y listo.`);
    }
    setSending(false);
  }

  if (!cartOpen) return null;

  // Empujón para completar el equipo: aparece cuando falta una sola parte
  // para llegar al descuento.
  const missing = KIT_PARTS.filter((part) => !saving.parts.includes(part));
  const oneAway = kit !== null && saving.amount === 0 && saving.parts.length === kit.min - 1;

  return (
    <>
      <div className="scrim" onClick={closeCart} />
      <aside
        className={lines.length ? "drawer" : "drawer is-empty"}
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div
          className="drawer-head"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <button
            className="sheet-handle"
            type="button"
            onClick={toggleSheet}
            onKeyDown={onHandleKey}
            aria-label="Agrandar o achicar el carrito. También podés arrastrar, o usar las flechas."
          />
          <h2 id="drawer-title">Tu carrito</h2>
          <button className="icon-btn" type="button" onClick={closeCart} aria-label="Cerrar carrito" autoFocus>
            ×
          </button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 && (
            <div className="empty-cart">
              <span className="empty-art" aria-hidden="true">
                <ProductArt shape="camionero" />
              </span>
              <strong>Tu carrito está vacío</strong>
              <p>Más vacío que el termo un domingo a la noche. Elegí tu mate y lo llenamos.</p>
              <a className="btn accent" href="#catalogo" onClick={closeCart}>
                Ver los mates
              </a>
            </div>
          )}
          {lines.map(({ key, product, design, qty }) => (
            <div className="line" key={key}>
              <div className="thumb">
                {(design?.images[0] ?? product.images[0]) ? (
                  <Image src={design?.images[0] ?? product.images[0]} alt="" fill sizes="64px" />
                ) : (
                  <ProductArt shape={product.shape} />
                )}
              </div>
              <div className="line-info">
                <strong>{productLabel(product, design)}</strong>
                <div className="line-row">
                  {design ? (
                    // un diseño es una pieza única: no hay cantidad que elegir
                    <span className="muted">Pieza única</span>
                  ) : (
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => decrement(key)}
                        aria-label={product.byWeight ? "Quitar 250 gramos" : "Quitar una unidad"}
                      >
                        −
                      </button>
                      <span>{product.byWeight ? weightLabel(qty) : qty}</span>
                      <button
                        type="button"
                        onClick={() => add(key)}
                        aria-label={product.byWeight ? "Sumar 250 gramos" : "Sumar una unidad"}
                      >
                        +
                      </button>
                    </div>
                  )}
                  <span className="line-price">{money(lineTotal(product, qty))}</span>
                </div>
                <button className="rm" type="button" onClick={() => remove(key)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {oneAway && kit && (
            <p className="kit-nudge">
              Sumá {missing.map((part) => PART_NAME[part.id]).join(" o ")} y tenés <b>{kit.percent} % de descuento</b> por
              armar equipo.
            </p>
          )}
        </div>

        {lines.length > 0 && (
          <div className="drawer-foot">
            <div>
              <label htmlFor="c-name">Tu nombre</label>
              <input
                id="c-name"
                type="text"
                placeholder="Para saber a quién responderle"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="c-note">Aclaraciones (opcional)</label>
              <textarea
                id="c-note"
                rows={2}
                placeholder="Localidad, color, algo que quieras consultar…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {saving.amount > 0 && kit && (
              <div className="total-row saving-row">
                <span>Armaste equipo: {kit.percent} % de descuento</span>
                <span>−{money(saving.amount)}</span>
              </div>
            )}
            <div className="total-row">
              <span className="muted">Total</span>
              <strong>
                {saving.amount > 0 && <s className="was">{money(subtotal)}</s>} {money(total)}
              </strong>
            </div>
            <button className="btn wa wide" type="button" disabled={sending} onClick={send}>
              <WhatsAppIcon />
              {sending ? "Armando tu pedido…" : "Mandar pedido por WhatsApp"}
            </button>
            <p className="fine">
              Se abre WhatsApp con tu pedido ya escrito. El envío y el pago los coordinamos por ahí.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
