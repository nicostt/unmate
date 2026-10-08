"use client";

import Image from "next/image";
import { WhatsAppIcon } from "@/components/site/BrandIcons";
import { useState } from "react";
import { money } from "@/lib/format";
import { createOrder } from "@/lib/orders";
import { orderMessage, whatsappLink } from "@/lib/site";
import { lineTotal, productLabel, weightLabel } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Panel del carrito que entra desde la derecha. El botón final registra el
// pedido en la base y abre WhatsApp con el pedido ya escrito.
export function CartDrawer() {
  const { lines, total, add, decrement, remove, clear, notify, cartOpen, closeCart } = useShop();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  useOverlay(cartOpen, closeCart);

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
      notify(`"${result.soldOut}" ya no tiene stock suficiente. Ajustá tu carrito para seguir.`);
      setSending(false);
      return;
    }
    const orderNumber = result?.number ?? null;
    const link = whatsappLink(orderMessage(lines, total, name, note, orderNumber));
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
      notify(`Pedido #${orderNumber} registrado. Terminá de enviarlo por WhatsApp.`);
    }
    setSending(false);
  }

  if (!cartOpen) return null;

  return (
    <>
      <div className="scrim" onClick={closeCart} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-head">
          <h2 id="drawer-title">Tu carrito</h2>
          <button className="icon-btn" type="button" onClick={closeCart} aria-label="Cerrar carrito" autoFocus>
            ×
          </button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 && (
            <div className="empty-cart">
              <p>Tu carrito está vacío. Sumá productos del catálogo y armamos el pedido.</p>
              <a className="btn ghost small" href="#catalogo" onClick={closeCart}>
                Ver catálogo
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
            <div className="total-row">
              <span className="muted">Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn wa wide" type="button" disabled={sending} onClick={send}>
              <WhatsAppIcon />
              {sending ? "Preparando el pedido…" : "Enviar pedido por WhatsApp"}
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
