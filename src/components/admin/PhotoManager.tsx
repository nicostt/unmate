"use client";

import Image from "next/image";
import { useState } from "react";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { uploadPhoto } from "./photos";
import { photosOf, type AdminMedia, type AdminProduct } from "./types";

// Fotos de un producto, o de uno de sus diseños si se pasa designId:
// subir, ordenar y borrar. La primera es la principal.
export function PhotoManager({
  product,
  designId = null,
  limit,
  onChanged,
}: {
  product: AdminProduct;
  designId?: number | null;
  limit?: number; // máximo de fotos (sin tope si no se indica)
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = photosOf(product, designId);
  const room = limit === undefined ? Infinity : limit - photos.length;

  // Envuelve cada operación: bloquea los botones mientras corre y muestra el error si falla.
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

  function upload(files: File[]) {
    return work(async () => {
      let order = Math.max(0, ...photos.map((m) => m.sort_order));
      for (const file of files.slice(0, room)) {
        await uploadPhoto(file, product.id, designId, ++order);
      }
    });
  }

  function remove(photo: AdminMedia) {
    if (!confirm("¿Borrar esta foto?")) return;
    return work(async () => {
      await supabase.storage.from(PHOTOS_BUCKET).remove([photo.path]);
      const { error } = await supabase.from("product_media").delete().eq("id", photo.id);
      if (error) throw new Error(error.message);
    });
  }

  // Mueve una foto un lugar (-1 izquierda, +1 derecha) y renumera el orden.
  function move(index: number, by: -1 | 1) {
    const next = [...photos];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    return work(async () => {
      for (const [i, photo] of next.entries()) {
        if (photo.sort_order === i + 1) continue;
        const { error } = await supabase.from("product_media").update({ sort_order: i + 1 }).eq("id", photo.id);
        if (error) throw new Error(error.message);
      }
    });
  }

  return (
    <>
      <div className="admin-photo-grid">
        {photos.map((photo, i) => (
          <div className="admin-photo" key={photo.id}>
            <div className="admin-photo-img">
              <Image src={photoUrl(photo.path)} alt={`Foto ${i + 1}`} fill sizes="160px" />
              {i === 0 && <span className="off">Principal</span>}
            </div>
            <div className="admin-photo-actions">
              <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Mover a la izquierda">
                ←
              </button>
              <button
                type="button"
                disabled={busy || i === photos.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Mover a la derecha"
              >
                →
              </button>
              <button type="button" disabled={busy} onClick={() => remove(photo)}>
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {room > 0 && (
        <label className={busy ? "btn ghost small is-busy" : "btn ghost small"}>
          {busy ? "Trabajando…" : designId ? "+ Sumar otro ángulo" : "+ Subir fotos"}
          <input
            className="sr"
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) upload([...e.target.files]);
              e.target.value = ""; // permite volver a elegir el mismo archivo
            }}
          />
        </label>
      )}
      {error && <p className="admin-error">{error}</p>}
    </>
  );
}
