"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Galería de fotos de un producto. Las fotos van una al lado de la otra en
// una tira que se desliza con el dedo (el "imán" que frena en cada foto es
// CSS: scroll-snap). En compu aparecen flechas, y abajo un puntito por foto.
export function Gallery({
  images,
  alt,
  sizes,
  onOpen,
}: {
  images: string[];
  alt: string;
  sizes: string; // ancho aproximado en pantalla, para que Next elija el tamaño de archivo
  onOpen?: () => void; // qué hacer al tocar una foto (opcional)
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function goTo(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const many = images.length > 1;

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
              onClick={() => goTo(index - 1)}
              aria-label="Foto anterior"
            >
              ‹
            </button>
          )}
          {index < images.length - 1 && (
            <button
              className="gallery-arrow next"
              type="button"
              onClick={() => goTo(index + 1)}
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
