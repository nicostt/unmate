"use client";

import Image from "next/image";
import { useState } from "react";
import { money } from "@/lib/format";
import { orderMessage, whatsappLink } from "@/lib/site";
import { optionName } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Panel del carrito que entra desde la derecha. El botón final abre WhatsApp
// con el pedido ya escrito.
export function CartDrawer() {
  const { lines, total, add, decrement, remove, cartOpen, closeCart } = useShop();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  useOverlay(cartOpen, closeCart);

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
          {lines.map(({ product, option, qty }) => (
            <div className="line" key={option.key}>
              <div className="thumb">
                {product.images.length ? (
                  <Image src={product.images[0]} alt="" fill sizes="64px" />
                ) : (
                  <ProductArt shape={product.shape} />
                )}
              </div>
              <div className="line-info">
                <strong>{optionName(product, option)}</strong>
                <div className="line-row">
                  <div className="qty">
                    <button type="button" onClick={() => decrement(option.key)} aria-label="Quitar una unidad">
                      −
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => add(option.key)} aria-label="Sumar una unidad">
                      +
                    </button>
                  </div>
                  <span className="line-price">{money(option.price * qty)}</span>
                </div>
                <button className="rm" type="button" onClick={() => remove(option.key)}>
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
            <a
              className="btn primary wide"
              href={whatsappLink(orderMessage(lines, total, name, note))}
              target="_blank"
              rel="noopener"
            >
              Enviar pedido por WhatsApp
            </a>
            <p className="fine">
              Se abre WhatsApp con tu pedido ya escrito. El envío y el pago los coordinamos por ahí.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
