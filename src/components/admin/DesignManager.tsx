"use client";

import { useEffect, useState } from "react";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import { DropZone } from "./DropZone";
import { PhotoManager } from "./PhotoManager";
import { uploadPhoto } from "./photos";
import { designsOf, photosOf, type AdminDesign, type AdminProduct } from "./types";

// Máximo de fotos por diseño: la principal y tres ángulos más.
const PHOTOS_PER_DESIGN = 4;

// Diseños de un tipo de mate: cada uno es una pieza única con su número y
// sus fotos. Hay tantos en stock como diseños cargados.
//
// Si un cliente pidió un diseño, acá aparece marcado con el número de
// pedido. Al CONFIRMAR ese pedido el diseño queda apartado (baja del
// stock y deja de ofrecerse) y al marcarlo ENTREGADO se elimina solo. También se puede
// eliminar a mano desde acá.
export function DesignManager({ product, onChanged }: { product: AdminProduct; onChanged: () => Promise<void> }) {
  const designs = designsOf(product);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // diseño -> números de los pedidos (no cancelados) que lo incluyen
  const [requested, setRequested] = useState<Record<number, number[]>>({});

  const ids = designs.map((d) => d.id).join(",");
  useEffect(() => {
    if (!ids) return;
    supabase
      .from("order_items")
      .select("design_id, order_id, orders!inner(status)")
      .in("design_id", ids.split(",").map(Number))
      .neq("orders.status", "cancelado")
      .then(({ data }) => {
        const map: Record<number, number[]> = {};
        for (const row of data ?? []) (map[row.design_id] ??= []).push(row.order_id);
        setRequested(map);
      });
  }, [ids]);

  async function work(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    await onChanged();
    setBusy(false);
  }

  // Un diseño nuevo nace de su foto: se crea con el número siguiente y se le sube la imagen.
  function addDesigns(files: File[]) {
    return work(async () => {
      let number = Math.max(0, ...designs.map((d) => d.number));
      for (const file of files) {
        const created = await supabase
          .from("product_designs")
          .insert({ product_id: product.id, number: ++number })
          .select("id")
          .single();
        if (created.error) throw new Error(created.error.message);
        await uploadPhoto(file, product.id, created.data.id, 1);
      }
    });
  }

  function remove(design: AdminDesign) {
    const orders = requested[design.id];
    const warning = orders?.length ? ` Está pedido en el pedido #${orders.join(", #")}.` : "";
    if (!confirm(`¿Eliminar el diseño #${design.number}? Desaparece de la tienda.${warning}`)) return;
    return work(async () => {
      const paths = photosOf(product, design.id).map((m) => m.path);
      if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
      // al borrar el diseño, la base borra sola las filas de sus fotos
      const { error } = await supabase.from("product_designs").delete().eq("id", design.id);
      if (error) throw new Error(error.message);
    });
  }

  return (
    <section className="admin-photos">
      <h3>Diseños ({designs.length} en stock)</h3>
      <p className="muted">
        Cada diseño es una pieza única. Subí una foto por cada mate que tengas: se numeran solos. Después podés
        sumarle hasta tres ángulos más. Al confirmar un pedido su diseño baja del stock, y al entregarlo se elimina solo.
      </p>

      {designs.map((design) => (
        <article className="admin-design" key={design.id}>
          <header>
            <strong>Diseño #{design.number}</strong>
            {design.is_hidden ? (
              <span className="admin-status is-pendiente">Apartado por un pedido confirmado</span>
            ) : null}
            {requested[design.id]?.length ? (
              <span className="admin-status">Pedido #{requested[design.id].join(", #")}</span>
            ) : null}
            <button className="btn ghost small danger" type="button" disabled={busy} onClick={() => remove(design)}>
              Eliminar diseño
            </button>
          </header>
          <PhotoManager product={product} designId={design.id} limit={PHOTOS_PER_DESIGN} onChanged={onChanged} />
        </article>
      ))}

      <DropZone label="+ Nuevos diseños: una foto por cada mate" busy={busy} onFiles={addDesigns} />
      {error && <p className="admin-error">{error}</p>}
    </section>
  );
}
