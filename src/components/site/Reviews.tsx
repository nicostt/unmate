"use client";

import Image from "next/image";
import { useState } from "react";
import type { Review } from "@/lib/types";

// Cuántas reseñas se ven de entrada si el admin no marcó ninguna como portada.
const COVER_COUNT = 3;

// Hasta cuántos caracteres un texto se considera "corto" y se muestra en letra grande.
const SHORT_TEXT = 90;

// Reseñas de clientes, cargadas desde el panel (pestaña Reseñas).
// De entrada se ve una portada con las que el admin eligió; el resto aparece
// al tocar "Ver todas" y se vuelve a guardar con "Ver menos".
// Las tarjetas se acomodan en columnas de alto libre, y cada una toma forma
// según lo que tenga: foto arriba, solo una frase en grande, o texto largo.
// Si no hay ninguna reseña, la sección directamente no aparece.
export function Reviews({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false);
  if (reviews.length === 0) return null;

  const featured = reviews.filter((r) => r.featured);
  const cover = featured.length ? featured : reviews.slice(0, COVER_COUNT);
  const rest = reviews.filter((r) => !cover.includes(r));
  const visible = expanded ? [...cover, ...rest] : cover;

  return (
    <section className="wrap block" id="resenas">
      <div className="sec-head">
        <div>
          <p className="eyebrow">Reseñas</p>
          <h2>Ya toman mate con nosotros</h2>
        </div>
        <p className="muted">
          {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
        </p>
      </div>

      <div className="reviews">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {rest.length > 0 && (
        <button className="btn ghost reviews-more" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Ver menos" : `Ver todas las reseñas (${reviews.length})`}
        </button>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const hasPhotos = review.photos.length > 0;
  const short = !!review.text && review.text.length <= SHORT_TEXT;
  // sin foto, la frase es la protagonista
  const kind = hasPhotos ? "with-photo" : short ? "is-quote" : "is-text";

  return (
    <figure className={`review ${kind}`}>
      {hasPhotos && (
        <div className={review.photos.length > 1 ? "review-photos many" : "review-photos"}>
          {review.photos.map((src, i) => (
            <div key={src}>
              <Image
                src={src}
                alt={`Foto que nos mandó ${review.name}${review.photos.length > 1 ? ` (${i + 1})` : ""}`}
                fill
                sizes="(max-width: 560px) 90vw, 340px"
              />
            </div>
          ))}
        </div>
      )}
      {review.text && <blockquote>{review.text}</blockquote>}
      <figcaption>
        {review.avatar ? (
          <span className="review-avatar">
            <Image src={review.avatar} alt="" fill sizes="40px" />
          </span>
        ) : (
          // sin foto del cliente: su inicial
          <span className="review-avatar" aria-hidden="true">
            {review.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        {review.name}
      </figcaption>
    </figure>
  );
}
