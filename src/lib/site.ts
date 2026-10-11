import { money } from "./format";
import { lineLabel, lineTotal, type CartLine } from "./types";

// Datos de contacto del negocio, en un solo lugar.
export const WHATSAPP_NUMBER = "5493364348318";
export const WHATSAPP_DISPLAY = "+54 9 3364 34-8318";
export const INSTAGRAM_URL = "https://instagram.com/unmate.es";

// Link que abre WhatsApp con un mensaje ya escrito.
export function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const CONSULTA_LINK = whatsappLink("Hola unmate.es! Quiero hacer una consulta.");

// Texto del pedido que se manda por WhatsApp.
// `orderNumber` es el número con que quedó registrado; null si no se pudo registrar.
export function orderMessage(
  lines: CartLine[],
  total: number,
  name: string,
  note: string,
  orderNumber: number | null,
  saving = 0, // descuento por armar equipo, en pesos (ya restado de `total`)
): string {
  let t = orderNumber
    ? `Hola unmate.es! Quiero hacer este pedido (Pedido #${orderNumber}):\n\n`
    : "Hola unmate.es! Quiero hacer este pedido:\n\n";
  for (const line of lines) {
    t += `• ${lineLabel(line)} — ${money(lineTotal(line.product, line.qty))}\n`;
    // WhatsApp no deja adjuntar una imagen desde un link: va el enlace a la
    // foto del diseño elegido, para que no haya dudas de cuál es.
    if (line.design) t += `   Foto: ${line.design.images[0]}\n`;
  }
  if (saving > 0) t += `\nDescuento por armar equipo: −${money(saving)}`;
  t += `\nTotal: ${money(total)}\n`;
  if (name.trim()) t += `\nNombre: ${name.trim()}`;
  if (note.trim()) t += `\nAclaraciones: ${note.trim()}`;
  t += "\n\n¿Me confirmás disponibilidad y costo de envío?";
  return t;
}
