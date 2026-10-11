"use client";

import Image from "next/image";
import { useState } from "react";
import type { Review } from "@/lib/types";

// Cuántas reseñas se ven de entrada, como máximo. Si el admin marcó más que
// esto "en portada", las que sobran pasan abajo con el resto.
const COVER_MAX = 5;

// Cuántas se ven de entrada si el admin no marcó ninguna.
const COVER_DEFAULT = 3;

// Reseñas de clientes, cargadas desde el panel (pestaña Reseñas).
// De entrada se ve una portada corta; el resto aparece al tocar "Ver todas"
// y se vuelve a guardar con "Ver menos".
// Cada tarjeta se parece a un comentario: quién lo dijo arriba, lo que dijo
// en una letra distinta, y abajo las fotos que mandó, en miniatura.
// Si no hay ninguna reseña, la sección directamente no aparece.
export function Reviews({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false);
  if (reviews.length === 0) return null;

  const featured = reviews.filter((r) => r.featured);
  const cover = featured.length ? featured.slice(0, COVER_MAX) : reviews.slice(0, COVER_DEFAULT);
  const rest = reviews.filter((r) => !cover.includes(r));
  const visible = expanded ? [...cover, ...rest] : cover;

  return (
    <section className="wrap block" id="resenas" data-reveal>
      <div className="sec-head">
        <h2>Ya toman mate con nosotros</h2>
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
        <button
          className="btn ghost reviews-more"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ver menos" : `Ver todas las reseñas (${reviews.length})`}
        </button>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="review">
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
      {review.text && <blockquote>{review.text}</blockquote>}
      {review.photos.length > 0 && (
        <div className="review-photos">
          {review.photos.map((src, i) => (
            // la miniatura abre la foto completa en otra pestaña
            <a key={src} href={src} target="_blank" rel="noopener">
              <Image
                src={src}
                alt={`Foto que nos mandó ${review.name}${review.photos.length > 1 ? ` (${i + 1})` : ""}`}
                fill
                sizes="96px"
              />
            </a>
          ))}
        </div>
      )}
    </figure>
  );
}
