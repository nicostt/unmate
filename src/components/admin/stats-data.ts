import { supabase } from "@/lib/supabase";
import type { AdminProduct } from "./types";

// Lectura y cálculo de las estadísticas. La base guarda los datos crudos
// (tablas events, carts, orders); acá se cuentan y se agrupan para mostrarlos.

type EventRow = {
  created_at: string;
  visitor: string;
  type: "visit" | "view" | "add" | "search" | "order";
  product_id: number | null;
  design_id: number | null;
  detail: string | null;
  value: number | null;
  source: string | null;
  device: string | null;
};

type OrderRow = {
  created_at: string;
  status: string;
  total: number;
  order_items: { product_name: string; by_weight: boolean; quantity: number; line_total: number }[];
};

type CartRow = { visitor: string; updated_at: string; items: { slug: string; qty: number }[] };

export type Raw = { events: EventRow[]; orders: OrderRow[]; carts: CartRow[] };

// Un renglón de un gráfico de barras: etiqueta, valor y un detalle opcional.
export type Bar = { label: string; value: number; note?: string };

const PAGE = 1000; // Supabase entrega de a 1000 filas como máximo

// Trae lo ocurrido en los últimos `days` días.
export async function fetchRaw(days: number): Promise<Raw> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const events: EventRow[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from("events")
      .select("created_at, visitor, type, product_id, design_id, detail, value, source, device")
      .gte("created_at", since)
      .order("id")
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    events.push(...(data as EventRow[]));
    if (data.length < PAGE) break;
  }

  const [orders, carts] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, status, total, order_items(product_name, by_weight, quantity, line_total)")
      .gte("created_at", since)
      .limit(PAGE),
    // carritos con movimiento en la última semana: los más viejos ya se dan por abandonados
    supabase
      .from("carts")
      .select("visitor, updated_at, items")
      .gte("updated_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .limit(PAGE),
  ]);
  const error = orders.error ?? carts.error;
  if (error) throw new Error(error.message);

  return { events, orders: orders.data as OrderRow[], carts: carts.data as CartRow[] };
}

// Cuenta PERSONAS distintas por clave: si alguien agrega 30 veces el mismo
// mate, cuenta una sola vez.
function peopleBy<K>(rows: EventRow[], keyOf: (row: EventRow) => K | null): Map<K, number> {
  const sets = new Map<K, Set<string>>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key === null) continue;
    if (!sets.has(key)) sets.set(key, new Set());
    sets.get(key)!.add(row.visitor);
  }
  return new Map([...sets].map(([key, set]) => [key, set.size]));
}

const people = (rows: EventRow[]) => new Set(rows.map((r) => r.visitor)).size;

const toBars = (map: Map<string, number>, top = 8): Bar[] =>
  [...map]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top);

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" });

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function compute({ events, orders, carts }: Raw, products: AdminProduct[], days: number) {
  const of = (type: EventRow["type"]) => events.filter((e) => e.type === type);
  const visits = of("visit");
  const views = of("view");
  const adds = of("add");
  const ordered = of("order");
  const searches = of("search");

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const sold = orders.filter((o) => o.status === "confirmado" || o.status === "entregado");

  // --- embudo: de los que entraron, cuántos llegaron a cada paso
  const funnel: Bar[] = [
    { label: "Entraron a la tienda", value: people(events) },
    { label: "Abrieron un producto", value: people(views) },
    { label: "Agregaron al carrito", value: people(adds) },
    { label: "Mandaron el pedido", value: people(ordered) },
    { label: "Pedidos que confirmaste", value: sold.length },
  ];

  // --- visitantes por día, con todos los días del período (también los que dieron cero)
  const perDayMap = peopleBy(visits, (e) => dayKey(e.created_at));
  const perDay: Bar[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const label = dayKey(new Date(Date.now() - i * 86_400_000).toISOString());
    perDay.push({ label, value: perDayMap.get(label) ?? 0 });
  }

  // --- productos: interés (personas que lo vieron / agregaron) contra pedidos
  const viewers = peopleBy(views, (e) => e.product_id);
  const adders = peopleBy(adds, (e) => e.product_id);
  const buyers = peopleBy(ordered, (e) => e.product_id);
  const productRows = products
    .map((p) => ({
      name: p.name,
      viewers: viewers.get(p.id) ?? 0,
      adders: adders.get(p.id) ?? 0,
      buyers: buyers.get(p.id) ?? 0,
      soldOut: p.by_design ? p.product_designs.length === 0 : p.stock === 0,
    }))
    .filter((r) => r.viewers || r.adders || r.buyers)
    .sort((a, b) => b.adders - a.adders || b.viewers - a.viewers);

  // --- diseños más elegidos (personas que agregaron ese diseño puntual)
  const designLabel = new Map<number, string>();
  for (const p of products) for (const d of p.product_designs) designLabel.set(d.id, `${p.name} · #${d.number}`);
  const designs: Bar[] = [...peopleBy(adds, (e) => e.design_id)]
    .map(([id, value]) => ({ label: designLabel.get(id) ?? "Diseño ya eliminado", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // --- búsquedas: lo que más se busca, y lo que se busca y no existe
  const searchPeople = peopleBy(searches, (e) => e.detail);
  const withoutResults = new Set(searches.filter((e) => e.value === 0).map((e) => e.detail));
  const allSearches = toBars(searchPeople as Map<string, number>, 30);
  const topSearches = allSearches.filter((s) => !withoutResults.has(s.label)).slice(0, 8);
  const missedSearches = allSearches.filter((s) => withoutResults.has(s.label)).slice(0, 8);

  // --- de dónde llegan y con qué
  const sources = toBars(peopleBy(visits, (e) => e.source ?? "directo"));
  const devices = toBars(peopleBy(visits, (e) => e.device ?? "sin dato"));

  // --- cuándo hay más movimiento
  const hourMap = peopleBy(visits, (e) => new Date(e.created_at).getHours());
  const hours: Bar[] = Array.from({ length: 24 }, (_, h) => ({ label: `${h} h`, value: hourMap.get(h) ?? 0 }));
  const weekdayMap = peopleBy(visits, (e) => new Date(e.created_at).getDay());
  const weekdays: Bar[] = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: WEEKDAYS[d], value: weekdayMap.get(d) ?? 0 }));

  // --- ventas confirmadas
  const revenue = sold.reduce((sum, o) => sum + o.total, 0);
  const soldQty = new Map<string, number>();
  for (const o of sold)
    for (const item of o.order_items) {
      // la yerba se cuenta por pedido, no por gramos, para poder compararla con el resto
      soldQty.set(item.product_name, (soldQty.get(item.product_name) ?? 0) + (item.by_weight ? 1 : item.quantity));
    }

  // --- carritos sin terminar: qué tienen adentro y cuánto suman
  const inCarts = new Map<string, number>();
  let cartsValue = 0;
  for (const cart of carts)
    for (const item of cart.items) {
      const product = bySlug.get(item.slug);
      if (!product) continue;
      inCarts.set(product.name, (inCarts.get(product.name) ?? 0) + 1);
      cartsValue += product.shape === "yerba" ? Math.round((product.price * item.qty) / 1000) : product.price * item.qty;
    }

  return {
    empty: events.length === 0 && orders.length === 0 && carts.length === 0,
    visitors: people(events),
    ordersSent: orders.length,
    ordersConfirmed: sold.length,
    revenue,
    averageTicket: sold.length ? Math.round(revenue / sold.length) : 0,
    openCarts: carts.length,
    cartsValue,
    inCarts: toBars(inCarts),
    funnel,
    perDay,
    productRows,
    // interés sin compra: lo agregaron varios y casi nadie lo pidió
    wanted: productRows
      .filter((r) => r.adders > r.buyers)
      .map((r) => ({ label: r.name, value: r.adders - r.buyers, note: `${r.adders} lo agregaron, ${r.buyers} lo pidieron` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    // agotados que la gente sigue mirando: candidatos a reponer
    soldOutWanted: productRows
      .filter((r) => r.soldOut && r.viewers > 0)
      .map((r) => ({ label: r.name, value: r.viewers }))
      .slice(0, 8),
    designs,
    topSearches,
    missedSearches,
    sources,
    devices,
    hours,
    weekdays,
    bestSellers: toBars(soldQty),
  };
}

export type Computed = ReturnType<typeof compute>;
