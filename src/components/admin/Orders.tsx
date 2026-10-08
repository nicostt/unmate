"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { weightLabel } from "@/lib/types";

type Status = "pendiente" | "confirmado" | "entregado" | "cancelado";

type OrderItem = {
  id: number;
  product_name: string;
  by_weight: boolean;
  quantity: number; // unidades, o gramos si by_weight
  line_total: number;
};

type Order = {
  id: number; // es el número de pedido
  created_at: string;
  customer_name: string | null;
  note: string | null;
  status: Status;
  total: number;
  order_items: OrderItem[];
};

const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// Qué se puede hacer con un pedido según su estado: [estado nuevo, texto del botón].
const NEXT_STEPS: Record<Status, [Status, string][]> = {
  pendiente: [
    ["confirmado", "Confirmar"],
    ["cancelado", "Cancelar"],
  ],
  confirmado: [
    ["entregado", "Marcar entregado"],
    ["cancelado", "Cancelar"],
  ],
  entregado: [["cancelado", "Cancelar"]],
  cancelado: [["pendiente", "Reabrir"]],
};

async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, by_weight, quantity, line_total)")
    .order("id", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data as Order[];
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Pedidos que llegaron desde la tienda. Confirmar un pedido descuenta el
// stock; cancelarlo (o reabrirlo) lo devuelve. Eso lo hace la base, en la
// función set_order_status.
export function Orders({ onStockChanged }: { onStockChanged: () => Promise<void> }) {
  const [orders, setOrders] = useState<Order[]>();
  const [filter, setFilter] = useState<Status | "todos">("pendiente");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  useEffect(() => {
    fetchOrders().then(setOrders, fail);
  }, []);

  async function run(action: PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError("");
    const { error } = await action;
    if (error) setError(error.message);
    await fetchOrders().then(setOrders, fail);
    await onStockChanged(); // el stock pudo cambiar: refrescar productos y tienda
    setBusy(false);
  }

  if (!orders) return <p className="admin-msg">{error || "Cargando pedidos…"}</p>;

  const count = (status: Status) => orders.filter((o) => o.status === status).length;
  const visible = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  return (
    <section className="admin-section">
      <div className="chips" role="group" aria-label="Filtrar pedidos">
        {(["pendiente", "confirmado", "entregado", "cancelado"] as Status[]).map((status) => (
          <button
            key={status}
            className="chip"
            type="button"
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            {STATUS_LABEL[status]}s ({count(status)})
          </button>
        ))}
        <button className="chip" type="button" aria-pressed={filter === "todos"} onClick={() => setFilter("todos")}>
          Todos
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {visible.length === 0 && <p className="muted">No hay pedidos acá.</p>}

      <div className="admin-list">
        {visible.map((order) => (
          <article className="admin-order" key={order.id}>
            <header>
              <strong>Pedido #{order.id}</strong>
              <span className={`admin-status is-${order.status}`}>{STATUS_LABEL[order.status]}</span>
              <span className="muted">{when(order.created_at)}</span>
              <strong className="admin-order-total">{money(order.total)}</strong>
            </header>
            {order.customer_name && <p>{order.customer_name}</p>}
            <ul>
              {order.order_items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.by_weight
                      ? `${weightLabel(item.quantity)} de ${item.product_name}`
                      : `${item.quantity} × ${item.product_name}`}
                  </span>
                  <span className="muted">{money(item.line_total)}</span>
                </li>
              ))}
            </ul>
            {order.note && <p className="note">{order.note}</p>}
            <div className="admin-actions">
              {NEXT_STEPS[order.status].map(([status, label]) => (
                <button
                  key={status}
                  className={status === "cancelado" ? "btn ghost small danger" : "btn ghost small"}
                  type="button"
                  disabled={busy}
                  onClick={() => run(supabase.rpc("set_order_status", { p_order: order.id, p_status: status }))}
                >
                  {label}
                </button>
              ))}
              {/* borrar solo lo que no tiene stock tomado */}
              {(order.status === "cancelado" || order.status === "pendiente") && (
                <button
                  className="btn ghost small danger"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    confirm(`¿Eliminar el pedido #${order.id}? No se puede deshacer.`) &&
                    run(supabase.from("orders").delete().eq("id", order.id))
                  }
                >
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
