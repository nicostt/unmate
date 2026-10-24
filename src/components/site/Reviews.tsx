"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useFlip } from "@/components/shop/useFlip";
import { reducedMotion, viewTransition } from "@/lib/motion";
import type { Review } from "@/lib/types";
import { PhotoZoom, type ZoomPhoto } from "./PhotoZoom";

// Cuántas reseñas se ven de entrada, como máximo (pedido de Emanuel: 6).
// Primero van las que el admin marcó "en portada" y, si son menos, se
// completa con las demás en su orden. Las que sobran pasan a "Ver todas".
const COVER_MAX = 6;

// Ancho mínimo de una tarjeta y separación entre tarjetas, en px. Tienen que
// coincidir con .review y .reviews en src/styles/sections.css.
const CARD_MIN = 240;
const GAP = 14;

// Nombre que comparten la miniatura y la foto ampliada mientras una se
// transforma en la otra (ver .zoom-photo en src/styles/sections.css).
const ZOOM = "resena-foto";

// Reseñas de clientes, cargadas desde el panel (pestaña Reseñas).
// De entrada se ve una portada corta; el resto aparece al tocar "Ver todas"
// y se vuelve a guardar con "Ver menos".
// Cada tarjeta se parece a un comentario: quién lo dijo arriba, lo que dijo
// en una letra distinta, y abajo las fotos que mandó, en miniatura. Al tocar
// una foto se amplía ahí mismo, encima de la página (PhotoZoom.tsx).
// Si no hay ninguna reseña, la sección directamente no aparece.
export function Reviews({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false);
  // al desplegar o guardar, las reseñas aparecen y se van de a poco, no de golpe
  const { ref: section, snapshot } = useFlip<HTMLElement>();
  // foto ampliada: las de esa reseña y cuál se está viendo
  const [zoom, setZoom] = useState<{ photos: ZoomPhoto[]; index: number; alt: string } | null>(null);
  // las miniaturas de esa reseña, para que al cerrar la foto vuelva a la suya
  const thumbs = useRef<HTMLElement[]>([]);

  // Cuántas tarjetas entran por fila con el ancho que hay ahora. Sirve para
  // que la portada muestre solo filas completas: si no, la que sobra queda
  // sola en la fila de abajo, estirada de punta a punta.
  const list = useRef<HTMLDivElement>(null);
  const [perRow, setPerRow] = useState<number | null>(null);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => setPerRow(Math.max(1, Math.floor((el.clientWidth + GAP) / (CARD_MIN + GAP))));
    const watcher = new ResizeObserver(measure);
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  if (reviews.length === 0) return null;

  // Abrir y cerrar: la miniatura "crece" hasta ser la foto grande, y vuelve.
  // Durante el cambio las dos llevan el mismo view-transition-name.
  function openZoom(review: Review, index: number, thumb: HTMLElement) {
    thumbs.current = [...(thumb.parentElement?.children ?? [])] as HTMLElement[];
    // la forma de cada foto se saca de su miniatura, que ya está cargada
    const photos = review.photos.map((src, i) => {
      const img = thumbs.current[i]?.querySelector("img");
      return { src, ratio: img?.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1 };
    });
    if (!reducedMotion()) thumb.style.setProperty("view-transition-name", ZOOM);
    viewTransition(() => {
      thumb.style.removeProperty("view-transition-name"); // en la pantalla nueva el nombre lo lleva la foto grande
      flushSync(() => setZoom({ photos, index, alt: `Foto que nos mandó ${review.name}` }));
    });
  }

  function closeZoom() {
    const thumb = zoom && !reducedMotion() ? thumbs.current[zoom.index] : undefined;
    viewTransition(
      () => {
        flushSync(() => setZoom(null));
        thumb?.style.setProperty("view-transition-name", ZOOM);
      },
      () => thumb?.style.removeProperty("view-transition-name"),
    );
  }

  const featured = reviews.filter((r) => r.featured);
  const wanted = [...featured, ...reviews.filter((r) => !r.featured)].slice(0, COVER_MAX);
  // De la portada se muestran filas enteras: con 6 elegidas y 4 por fila, van
  // 4 y las otras dos pasan a "Ver todas". (En una sola columna van todas.)
  const full = perRow && perRow > 1 && wanted.length > perRow ? Math.floor(wanted.length / perRow) * perRow : wanted.length;
  const cover = wanted.slice(0, full);
  const rest = reviews.filter((r) => !cover.includes(r));
  const visible = expanded ? [...cover, ...rest] : cover;

  return (
    <section className="wrap block" id="resenas" data-reveal ref={section}>
      <div className="sec-head">
        <h2>Ya toman mate con nosotros</h2>
        <p className="muted">
          {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
        </p>
      </div>

      <div className="reviews" ref={list}>
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} onZoom={(index, thumb) => openZoom(review, index, thumb)} />
        ))}
      </div>

      {rest.length > 0 && (
        <button
          className="btn ghost reviews-more"
          type="button"
          aria-expanded={expanded}
          data-flip="ver-todas"
          onClick={() => {
            snapshot();
            setExpanded(!expanded);
          }}
        >
          {expanded ? "Ver menos" : `Ver todas las reseñas (${reviews.length})`}
        </button>
      )}

      {zoom && (
        <PhotoZoom
          photos={zoom.photos}
          index={zoom.index}
          alt={zoom.alt}
          onIndex={(index) => setZoom({ ...zoom, index })}
          onClose={closeZoom}
        />
      )}
    </section>
  );
}

function ReviewCard({
  review,
  onZoom,
}: {
  review: Review;
  onZoom: (index: number, thumb: HTMLElement) => void; // amplía esa foto
}) {
  return (
    <figure className="review" data-flip={review.id}>
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
            // al tocar la miniatura, la foto se amplía sin salir de la página
            <button
              key={src}
              type="button"
              aria-label={`Ampliar la foto${review.photos.length > 1 ? ` ${i + 1}` : ""} que nos mandó ${review.name}`}
              onClick={(e) => onZoom(i, e.currentTarget)}
            >
              <Image src={src} alt="" fill sizes="150px" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
