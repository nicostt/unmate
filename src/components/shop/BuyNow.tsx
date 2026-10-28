"use client";

import Image from "next/image";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/site/BrandIcons";
import { money } from "@/lib/format";
import { createOrder } from "@/lib/orders";
import { orderMessage, whatsappLink } from "@/lib/site";
import { lineTotal, weightLabel, type CartLine } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { useOverlay } from "./useOverlay";
import { usePresence } from "./usePresence";

// Cuánto dura la salida de la ventana: igual que .modal.is-closing (overlays.css).
const EXIT_MS = 260;

// "Comprar ya": ventana grande y directa para pedir UN producto sin pasar por
// el carrito (pedido de Emanuel, 28/10/2026). Muestra el producto, pide el
// nombre (y una aclaración opcional) y manda el pedido por WhatsApp. El
// pedido queda registrado en la base igual que uno del carrito
// (create_order), y lo que haya en el carrito no se toca.
// La abre ShopProvider (buyNow) desde los botones de compra (BuyBox).
export function BuyNow({
  line,
  onClose,
  notify,
}: {
  line: CartLine | null; // qué se compra; null = cerrada
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const open = line !== null;
  const { shown, closing } = usePresence(open, EXIT_MS);
  // la última línea se recuerda para poder mostrarla mientras se va
  const [last, setLast] = useState<CartLine | null>(line);
  if (line && line !== last) setLast(line);
  useOverlay(open, onClose);

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const current = line ?? last;
  if (!shown || !current) return null;

  const { product, design, qty } = current;
  const total = lineTotal(product, qty);
  const photo = (design ? design.images : product.images)[0];

  // Igual que el carrito (CartDrawer): la pestaña se abre ya mismo y, cuando
  // la base devuelve el número de pedido, se la manda a WhatsApp.
  async function send() {
    if (!current) return;
    setSending(true);
    const tab = window.open("", "_blank");
    const result = await createOrder([current], name, note);
    if (result && "soldOut" in result) {
      tab?.close();
      notify(`Uy, "${result.soldOut}" se acaba de agotar.`);
      setSending(false);
      onClose();
      return;
    }
    const orderNumber = result?.number ?? null;
    const link = whatsappLink(orderMessage([current], total, name, note, orderNumber, 0));
    if (tab) {
      tab.opener = null;
      tab.location.href = link;
    } else {
      window.location.assign(link);
    }
    if (orderNumber) {
      onClose();
      notify(`¡Pedido #${orderNumber} anotado! Tocá enviar en WhatsApp y listo.`);
    }
    setSending(false);
  }

  return (
    <div
      className={closing ? "modal is-closing" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card buy-now">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
          ×
        </button>
        <div className="buy-now-art">
          {photo ? (
            <Image src={photo} alt="" fill sizes="(max-width: 700px) 92vw, 380px" />
          ) : (
            <ProductArt shape={product.shape} />
          )}
        </div>
        <div className="buy-now-info">
          <h3 id="buy-title">{product.name}</h3>
          <p className="muted">{product.byWeight ? weightLabel(qty) : "1 unidad"}</p>
          <p className="buy-now-total">{money(total)}</p>
          <label htmlFor="b-name">Tu nombre</label>
          <input
            id="b-name"
            className="field-in"
            type="text"
            placeholder="Para saber a quién responderle"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="b-note">Aclaraciones (opcional)</label>
          <textarea
            id="b-note"
            className="field-in"
            rows={2}
            placeholder="Localidad, color, algo que quieras consultar…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btn wa wide big" type="button" disabled={sending} onClick={send}>
            <WhatsAppIcon />
            {sending ? "Armando tu pedido…" : "Pedir por WhatsApp"}
          </button>
          <p className="fine">
            Se abre WhatsApp con tu pedido ya escrito. El envío y el pago los coordinamos por ahí. Lo que tengas en el
            carrito queda guardado.
          </p>
        </div>
      </div>
    </div>
  );
}
