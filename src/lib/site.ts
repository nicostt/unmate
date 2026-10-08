import { money } from "./format";
import { optionName, type CartLine } from "./types";

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
export function orderMessage(lines: CartLine[], total: number, name: string, note: string): string {
  let t = "Hola unmate.es! Quiero hacer este pedido:\n\n";
  for (const { product, option, qty } of lines) {
    t += `• ${qty} × ${optionName(product, option)} — ${money(option.price * qty)}\n`;
  }
  t += `\nTotal: ${money(total)}\n`;
  if (name.trim()) t += `\nNombre: ${name.trim()}`;
  if (note.trim()) t += `\nAclaraciones: ${note.trim()}`;
  t += "\n\n¿Me confirmás disponibilidad y costo de envío?";
  return t;
}
