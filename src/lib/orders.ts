import { visitorId } from "./track";
import type { CartLine } from "./types";

// Resultado de intentar registrar un pedido:
//  - { number }  -> quedó registrado con ese número;
//  - { soldOut } -> NO se registró: ese producto ya no tiene stock suficiente;
//  - null        -> no se pudo registrar por otro motivo (sin conexión, base
//                   caída). El pedido igual puede seguir por WhatsApp, sin número.
export type OrderResult = { number: number } | { soldOut: string } | null;

// Así empieza el mensaje de error de la base cuando falta stock.
const NO_STOCK = "SIN_STOCK:";

// Registra el pedido en la base. Se manda solo qué productos, cuánto y qué
// diseño: los precios y el control de stock los hace la base (función
// create_order). Nunca lanza error.
export async function createOrder(lines: CartLine[], name: string, note: string): Promise<OrderResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/create_order`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_items: lines.map((line) => ({
          slug: line.product.slug,
          qty: line.qty,
          design: line.design?.id ?? null,
        })),
        p_name: name,
        p_note: note,
        p_visitor: visitorId(),
      }),
      signal: AbortSignal.timeout(6000), // no dejar al cliente esperando
    });
    const data = (await response.json()) as { number?: unknown; message?: unknown } | null;
    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : "";
      return message.startsWith(NO_STOCK) ? { soldOut: message.slice(NO_STOCK.length) } : null;
    }
    return typeof data?.number === "number" ? { number: data.number } : null;
  } catch {
    return null;
  }
}
