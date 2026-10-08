"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Cada cuánto pasa sola a la foto siguiente mientras `playing` está activo.
const AUTOPLAY_MS = 1800;

// Galería de fotos. Las fotos van una al lado de la otra en una tira que se
// desliza con el dedo (el "imán" que frena en cada foto es CSS: scroll-snap).
// En compu aparecen flechas, y abajo un puntito por foto.
export function Gallery({
  images,
  alt,
  sizes,
  playing = false,
  onOpen,
  onManual,
  onIndexChange,
}: {
  images: string[];
  alt: string;
  sizes: string; // ancho aproximado en pantalla, para que Next elija el tamaño de archivo
  playing?: boolean; // true = va pasando las fotos sola
  onOpen?: () => void; // qué hacer al tocar una foto
  onManual?: () => void; // avisa que la persona tocó una flecha (para frenar el pase automático)
  onIndexChange?: (index: number) => void; // avisa qué foto quedó a la vista
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  function goTo(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const el = track.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) {
      setIndex(next);
      onIndexChange?.(next);
    }
  }

  // Pase automático: avanza de a una y, al llegar a la última, vuelve a la primera.
  useEffect(() => {
    if (!playing || !many) return;
    const timer = setInterval(() => {
      const el = track.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((current + 1) % images.length) * el.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, many, images.length]);

  function manual(i: number) {
    onManual?.();
    goTo(i);
  }

  return (
    <div className="gallery">
      <div className="gallery-track" ref={track} onScroll={onScroll}>
        {images.map((src, i) => (
          <div
            className="gallery-slide"
            key={src}
            onClick={onOpen}
            style={onOpen ? { cursor: "pointer" } : undefined}
          >
            <Image
              src={src}
              alt={many ? `${alt}, foto ${i + 1} de ${images.length}` : alt}
              fill
              sizes={sizes}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {many && (
        <>
          {index > 0 && (
            <button
              className="gallery-arrow prev"
              type="button"
              onClick={() => manual(index - 1)}
              aria-label="Foto anterior"
            >
              ‹
            </button>
          )}
          {index < images.length - 1 && (
            <button
              className="gallery-arrow next"
              type="button"
              onClick={() => manual(index + 1)}
              aria-label="Foto siguiente"
            >
              ›
            </button>
          )}
          <div className="gallery-dots" aria-hidden="true">
            {images.map((src, i) => (
              <span key={src} className={i === index ? "on" : undefined} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
