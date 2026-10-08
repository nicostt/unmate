"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { DropZone } from "./DropZone";
import { storePhoto } from "./photos";

type ReviewRow = {
  id: number;
  name: string;
  text: string | null;
  photos: string[]; // ubicaciones en Storage
  is_active: boolean;
  sort_order: number;
};

async function fetchReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase.from("reviews").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data as ReviewRow[];
}

// Reseñas de clientes que se muestran al final de la tienda. Se cargan a
// mano: el nombre, las fotos que mandó el cliente y, si hay, lo que dijo.
export function ReviewsAdmin({ onChanged }: { onChanged: () => Promise<void> }) {
  const [reviews, setReviews] = useState<ReviewRow[]>();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]); // fotos ya subidas de la reseña que se está cargando
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  useEffect(() => {
    fetchReviews().then(setReviews, fail);
  }, []);

  // Envuelve cada operación: bloquea los botones, muestra el error y recarga.
  async function work(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      fail(e);
    }
    await fetchReviews().then(setReviews, fail);
    await onChanged();
    setBusy(false);
  }

  const addPhotos = (files: File[]) =>
    work(async () => {
      const paths: string[] = [];
      for (const file of files) paths.push(await storePhoto(file, "resenas"));
      setPhotos((current) => [...current, ...paths]);
    });

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Falta el nombre del cliente.");
    if (!photos.length && !text.trim()) return setError("Agregá al menos una foto o unas palabras.");
    await work(async () => {
      const sort_order = Math.max(0, ...(reviews ?? []).map((r) => r.sort_order)) + 1;
      const { error } = await supabase
        .from("reviews")
        .insert({ name: name.trim(), text: text.trim() || null, photos, sort_order });
      if (error) throw new Error(error.message);
      setName("");
      setText("");
      setPhotos([]);
    });
  }

  const remove = (review: ReviewRow) =>
    confirm(`¿Eliminar la reseña de ${review.name}?`) &&
    work(async () => {
      if (review.photos.length) await supabase.storage.from(PHOTOS_BUCKET).remove(review.photos);
      const { error } = await supabase.from("reviews").delete().eq("id", review.id);
      if (error) throw new Error(error.message);
    });

  const toggle = (review: ReviewRow) =>
    work(async () => {
      const { error } = await supabase.from("reviews").update({ is_active: !review.is_active }).eq("id", review.id);
      if (error) throw new Error(error.message);
    });

  if (!reviews) return <p className="admin-msg">{error || "Cargando reseñas…"}</p>;

  return (
    <section className="admin-section">
      <div className="admin-bar">
        <h2>Reseñas</h2>
        <p className="muted">Aparecen al final de la tienda. Cargá solo reseñas reales de tus clientes.</p>
      </div>

      <form className="admin-form" onSubmit={publish}>
        <label>
          Nombre del cliente
          <input className="field-in" placeholder="Martina" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="wide">
          Lo que dijo <small>(opcional)</small>
          <textarea className="field-in" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="wide">
          {photos.length > 0 && (
            <div className="admin-photo-grid">
              {photos.map((path) => (
                <div className="admin-photo" key={path}>
                  <div className="admin-photo-img">
                    <Image src={photoUrl(path)} alt="" fill sizes="160px" />
                  </div>
                  <div className="admin-photo-actions">
                    <button
                      type="button"
                      onClick={() => {
                        supabase.storage.from(PHOTOS_BUCKET).remove([path]);
                        setPhotos(photos.filter((p) => p !== path));
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DropZone label="+ Fotos que te mandó el cliente" busy={busy} onFiles={addPhotos} />
        </div>
        {error && <p className="admin-error wide">{error}</p>}
        <div className="admin-submit wide">
          <button className="btn primary" type="submit" disabled={busy}>
            Publicar reseña
          </button>
        </div>
      </form>

      <div className="admin-list">
        {reviews.length === 0 && <p className="muted">Todavía no cargaste ninguna reseña.</p>}
        {reviews.map((review) => (
          <div className={review.is_active ? "admin-row admin-cat" : "admin-row admin-cat is-hidden"} key={review.id}>
            <div className="admin-name">
              <strong>{review.name}</strong>
              <span className="muted">
                {review.photos.length} {review.photos.length === 1 ? "foto" : "fotos"}
                {review.text ? ` · "${review.text.slice(0, 70)}${review.text.length > 70 ? "…" : ""}"` : ""}
                {!review.is_active && " · oculta"}
              </span>
            </div>
            <span />
            <div className="admin-actions">
              <button className="btn ghost small" type="button" disabled={busy} onClick={() => toggle(review)}>
                {review.is_active ? "Ocultar" : "Mostrar"}
              </button>
              <button className="btn ghost small danger" type="button" disabled={busy} onClick={() => remove(review)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
