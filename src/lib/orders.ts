import { visitorId } from "./track";
import type { CartLine } from "./types";

// Registra el pedido en la base y devuelve su número (o null si no se pudo).
// Se manda solo qué productos, cuánto y qué diseño: los precios los calcula
// la base (función create_order).
//
// Nunca lanza error: si la base no responde, el pedido igual puede seguir
// por WhatsApp, solo que sin número.
export async function createOrder(lines: CartLine[], name: string, note: string): Promise<number | null> {
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
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const number = (data as { number?: unknown } | null)?.number;
    return typeof number === "number" ? number : null;
  } catch {
    return null;
  }
}
