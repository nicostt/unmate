"use client";

import Image from "next/image";
import { useState } from "react";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { DropZone } from "./DropZone";
import { HoldButton } from "./HoldButton";
import { useCropper } from "./PhotoCropper";
import { downloadPhoto, replacePhoto, uploadPhoto } from "./photos";
import { photosOf, type AdminMedia, type AdminProduct } from "./types";

// Fotos de un producto, o de uno de sus diseños si se pasa designId:
// subir, recortar, ordenar y borrar. La primera es la principal.
// Al subir, cada foto pasa por el recortador (PhotoCropper.tsx) para
// encuadrarla con la forma de la tarjeta de la tienda; "Recortar" vuelve a
// encuadrar una que ya está subida.
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
  const { askCrop, cropper } = useCropper();
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
        const photo = await askCrop(file);
        if (!photo) continue; // tocó "Cancelar": esa foto no se sube
        await uploadPhoto(photo, product.id, designId, ++order, true);
      }
    });
  }

  function recrop(media: AdminMedia) {
    return work(async () => {
      const photo = await askCrop(await downloadPhoto(media.path));
      if (photo) await replacePhoto(media.id, media.path, photo);
    });
  }

  function remove(photo: AdminMedia) {
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
              <button type="button" disabled={busy} onClick={() => recrop(photo)} title="Volver a encuadrar esta foto">
                Recortar
              </button>
              <HoldButton className="" disabled={busy} onConfirm={() => remove(photo)} title="Mantené apretado para borrar la foto">
                Borrar
              </HoldButton>
            </div>
          </div>
        ))}
      </div>
      {cropper}

      {room > 0 && (
        <DropZone label={designId ? "+ Sumar otro ángulo de este diseño" : "+ Subir fotos"} busy={busy} onFiles={upload} />
      )}
      {error && <p className="admin-error">{error}</p>}
    </>
  );
}
