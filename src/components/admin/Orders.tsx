"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { weightLabel } from "@/lib/types";
import { HoldButton } from "./HoldButton";

type Status = "pendiente" | "confirmado" | "entregado" | "cancelado";

type OrderItem = {
  id: number;
  product_name: string;
  by_weight: boolean;
  quantity: number; // unidades, o gramos si by_weight
  line_total: number;
  design_id: number | null; // null si no era un diseño, o si el diseño ya se eliminó
  design_number: number | null; // copia del número de diseño elegido
  design_photo: string | null; // copia de la ubicación de su foto principal
};

type Order = {
  id: number; // es el número de pedido
  created_at: string;
  customer_name: string | null;
  note: string | null;
  status: Status;
  total: number; // con el descuento ya restado
  discount?: number; // descuento por armar equipo (falta si no se ejecutó el SQL 0007)
  order_items: OrderItem[];
};

const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// Estados que se manejan en la pestaña Pedidos. Los entregados viven en Vendidos.
const OPEN_STATUSES: Status[] = ["pendiente", "confirmado", "cancelado"];

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
  entregado: [],
  // al reabrir se elige: confirmado vuelve a descontar el stock; pendiente no
  cancelado: [
    ["confirmado", "Reabrir confirmado (baja el stock)"],
    ["pendiente", "Reabrir como pendiente"],
  ],
};

async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, by_weight, quantity, line_total, design_id, design_number, design_photo)")
    .order("id", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return data as Order[];
}

// Nombre con que se muestra un pedido: "Pedido de Juan" con el nombre que
// escribió el cliente al pedir, o "Pedido #8" si no puso ninguno.
const orderName = (order: Order) => {
  const name = order.customer_name?.trim();
  return name ? `Pedido de ${name}` : `Pedido #${order.id}`;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Pedidos que llegaron desde la tienda. Se usa en dos pestañas del panel:
//  - mode "open" (Pedidos): los pendientes, confirmados y cancelados;
//  - mode "sold" (Vendidos): los entregados, como historial de ventas.
//
// Qué pasa al cambiar el estado (lo hace la base, función set_order_status):
//  - Confirmar: BAJA EL STOCK. Se descuentan unidades o gramos, y los
//    diseños pedidos (piezas únicas) dejan de ofrecerse.
//  - Marcar entregado: DEFINITIVO. El stock queda descontado, los diseños
//    se eliminan y el pedido pasa a Vendidos. No se puede volver atrás.
//  - Cancelar un confirmado: el stock vuelve y los diseños reaparecen.
export function Orders({ mode, onStockChanged }: { mode: "open" | "sold"; onStockChanged: () => Promise<void> }) {
  const [orders, setOrders] = useState<Order[]>();
  const [filter, setFilter] = useState<Status>("pendiente");
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

  async function setStatus(order: Order, status: Status) {
    if (status === "entregado") {
      const designs = order.order_items.filter((i) => i.design_id !== null);
      const warning = designs.length
        ? ` ${designs.length === 1 ? "El diseño pedido se elimina" : "Los diseños pedidos se eliminan"} de la tienda y no se puede deshacer.`
        : "";
      if (
        !confirm(
          `¿Marcar "${orderName(order)}" como entregado? Es definitivo: pasa a Vendidos y el stock queda descontado.${warning}`,
        )
      )
        return;
      // Al eliminar un diseño se van sus fotos de la tabla. Acá se borran del
      // almacenamiento los otros ángulos; la foto principal se conserva
      // porque es la que queda en el historial de Vendidos.
      const keep = designs.map((i) => i.design_photo);
      const { data } = await supabase
        .from("product_media")
        .select("path")
        .in("design_id", designs.map((i) => i.design_id));
      const extras = (data ?? []).map((m) => m.path).filter((path) => !keep.includes(path));
      if (extras.length) await supabase.storage.from(PHOTOS_BUCKET).remove(extras);
    }
    await run(supabase.rpc("set_order_status", { p_order: order.id, p_status: status }));
  }

  async function remove(order: Order) {
    // las fotos de diseños ya eliminados solo vivían para este historial
    const orphans = order.order_items.filter((i) => i.design_id === null && i.design_photo).map((i) => i.design_photo!);
    if (orphans.length) await supabase.storage.from(PHOTOS_BUCKET).remove(orphans);
    await run(supabase.from("orders").delete().eq("id", order.id));
  }

  if (!orders) return <p className="admin-msg">{error || "Cargando pedidos…"}</p>;

  const count = (status: Status) => orders.filter((o) => o.status === status).length;
  const visible = orders.filter((o) => o.status === (mode === "sold" ? "entregado" : filter));
  const soldTotal = visible.reduce((sum, o) => sum + o.total, 0);

  return (
    <section className="admin-section">
      {mode === "open" ? (
        <div className="chips" role="group" aria-label="Filtrar pedidos">
          {OPEN_STATUSES.map((status) => (
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
        </div>
      ) : (
        <div className="admin-bar">
          <h2>Vendidos</h2>
          <p className="muted">
            {visible.length} {visible.length === 1 ? "venta entregada" : "ventas entregadas"} · {money(soldTotal)}. Es tu
            historial: podés borrar lo que no quieras guardar.
          </p>
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}
      {visible.length === 0 && (
        <p className="muted">{mode === "sold" ? "Todavía no marcaste ningún pedido como entregado." : "No hay pedidos acá."}</p>
      )}

      <div className="admin-list">
        {visible.map((order) => (
          <article className="admin-order" key={order.id}>
            <header>
              <OrderName
                order={order}
                disabled={busy}
                onRename={(name) => run(supabase.from("orders").update({ customer_name: name }).eq("id", order.id))}
              />
              <span className={`admin-status is-${order.status}`}>{STATUS_LABEL[order.status]}</span>
              <span className="muted">#{order.id}</span>
              <span className="muted">{when(order.created_at)}</span>
              <strong className="admin-order-total">{money(order.total)}</strong>
            </header>
            <ul>
              {order.order_items.map((item) => (
                <li key={item.id}>
                  {item.design_photo && (
                    <a className="admin-thumb" href={photoUrl(item.design_photo)} target="_blank" rel="noopener">
                      <Image src={photoUrl(item.design_photo)} alt="Foto del diseño elegido" fill sizes="56px" />
                    </a>
                  )}
                  <span>
                    {item.by_weight
                      ? `${weightLabel(item.quantity)} de ${item.product_name}`
                      : `${item.quantity} × ${item.product_name}`}
                    {item.design_number !== null && <strong> · Diseño #{item.design_number}</strong>}
                  </span>
                  <span className="muted">{money(item.line_total)}</span>
                </li>
              ))}
            </ul>
            {(order.discount ?? 0) > 0 && (
              <p className="admin-order-discount">Descuento por armar equipo: −{money(order.discount ?? 0)}</p>
            )}
            {order.note && <p className="note">{order.note}</p>}
            <div className="admin-actions">
              {NEXT_STEPS[order.status].map(([status, label]) => (
                <button
                  key={status}
                  className={status === "cancelado" ? "btn ghost small danger" : "btn ghost small"}
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus(order, status)}
                >
                  {label}
                </button>
              ))}
              {/* un pedido confirmado tiene cosas apartadas: primero se cancela o se entrega */}
              {order.status !== "confirmado" && (
                <HoldButton
                  disabled={busy}
                  onConfirm={() => remove(order)}
                  title={
                    mode === "sold"
                      ? "Mantené apretado para borrarlo del historial. No devuelve stock y deja de contar en las estadísticas."
                      : "Mantené apretado para eliminar el pedido. No se puede deshacer."
                  }
                >
                  {mode === "sold" ? "Borrar del historial" : "Eliminar"}
                </HoldButton>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// Título de un pedido, con un lápiz para cambiarle el nombre.
function OrderName({
  order,
  disabled,
  onRename,
}: {
  order: Order;
  disabled: boolean;
  onRename: (name: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(order.customer_name ?? "");

  if (!editing) {
    return (
      <>
        <strong>{orderName(order)}</strong>
        <button className="admin-rename" type="button" disabled={disabled} onClick={() => setEditing(true)} title="Cambiar el nombre">
          ✎ <span className="sr">Cambiar el nombre del pedido</span>
        </button>
      </>
    );
  }

  return (
    <form
      className="admin-rename-form"
      onSubmit={(e) => {
        e.preventDefault();
        setEditing(false);
        onRename(name.trim() || null);
      }}
    >
      <input
        className="field-in"
        aria-label="Nombre del pedido"
        placeholder="Nombre"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn ghost small" type="submit">
        Guardar
      </button>
    </form>
  );
}
