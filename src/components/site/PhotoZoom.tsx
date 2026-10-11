"use client";

import Image from "next/image";
import { useEffect, useEffectEvent } from "react";
import { useOverlay } from "@/components/shop/useOverlay";

// Una foto para ampliar. `ratio` es su forma: ancho dividido alto (1 = cuadrada).
export type ZoomPhoto = { src: string; ratio: number };

// Foto ampliada: se abre encima de la página, sin salir de ella ni abrir otra
// pestaña. Se cierra con la X, con Escape o tocando en cualquier lado. Si hay
// varias fotos, se pasa de una a otra con las flechas (las de la pantalla o
// las del teclado).
export function PhotoZoom({
  photos,
  index,
  alt,
  onIndex,
  onClose,
}: {
  photos: ZoomPhoto[];
  index: number; // cuál se está viendo
  alt: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  useOverlay(true, onClose);
  const many = photos.length > 1;
  const step = (by: number) => onIndex((index + by + photos.length) % photos.length);
  const onArrowKey = useEffectEvent((by: number) => step(by));

  useEffect(() => {
    if (!many) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onArrowKey(-1);
      if (e.key === "ArrowRight") onArrowKey(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [many]);

  const photo = photos[index];

  return (
    <div
      className="modal zoom"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      // clic en el fondo oscuro = cerrar
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
        ×
      </button>
      {/* el recuadro toma la forma de la foto, así no sobra borde alrededor */}
      <div className="zoom-photo" style={{ "--ratio": photo.ratio } as React.CSSProperties} onClick={onClose}>
        {/* key: al pasar a otra foto, la nueva entra con su fundido */}
        <Image key={photo.src} src={photo.src} alt={alt} fill sizes="92vw" />
      </div>
      {many && (
        <>
          <button className="gallery-arrow prev" type="button" onClick={() => step(-1)} aria-label="Foto anterior">
            ‹
          </button>
          <button className="gallery-arrow next" type="button" onClick={() => step(1)} aria-label="Foto siguiente">
            ›
          </button>
          <p className="zoom-count" aria-live="polite">
            {index + 1} / {photos.length}
          </p>
        </>
      )}
    </div>
  );
}
