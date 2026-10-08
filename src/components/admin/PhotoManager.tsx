"use client";

import Image from "next/image";
import { useState } from "react";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { photosOf, type AdminMedia, type AdminProduct } from "./types";

// Lado más largo, en píxeles, con el que se guardan las fotos.
const MAX_SIDE = 1600;

// Achica la foto antes de subirla: una foto de celular pesa varios MB y la
// web no necesita tanto. Queda como JPG de hasta 1600 px.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // fondo blanco para imágenes con transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.85),
  );
}

// Fotos de un producto: subir, ordenar y borrar. La primera es la principal.
export function PhotoManager({ product, onChanged }: { product: AdminProduct; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = photosOf(product);

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

  function upload(files: FileList) {
    return work(async () => {
      let order = Math.max(0, ...photos.map((m) => m.sort_order));
      for (const file of files) {
        // 1) el archivo va a Storage, en una carpeta con el número del producto
        const path = `${product.id}/${crypto.randomUUID()}.jpg`;
        const stored = await supabase.storage
          .from(PHOTOS_BUCKET)
          .upload(path, await shrink(file), { contentType: "image/jpeg" });
        if (stored.error) throw new Error(stored.error.message);
        // 2) se anota en la tabla que esa foto pertenece a este producto
        const row = await supabase
          .from("product_media")
          .insert({ product_id: product.id, kind: "image", path, sort_order: ++order });
        if (row.error) throw new Error(row.error.message);
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
    <section className="admin-photos">
      <h3>Fotos</h3>
      <p className="muted">
        La primera es la principal. Con más de una, en la tienda se deslizan. Se achican solas al subirlas.
      </p>

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

      <label className={busy ? "btn ghost small is-busy" : "btn ghost small"}>
        {busy ? "Trabajando…" : "+ Subir fotos"}
        <input
          className="sr"
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />
      </label>
      {error && <p className="admin-error">{error}</p>}
    </section>
  );
}
