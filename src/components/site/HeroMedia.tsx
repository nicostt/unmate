"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Cada cuánto se pasa al fondo siguiente.
const SWITCH_MS = 7000;

const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

// Fondo de la portada: videos (o fotos) que ocupan toda la sección y se van
// fundiendo uno en otro. Todos están apilados; el que toca se hace visible y
// los demás se vuelven transparentes, y la transición es CSS.
// Los videos van sin sonido y en bucle, que es lo único que los navegadores
// dejan reproducir solos.
export function HeroMedia({ media }: { media: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % media.length), SWITCH_MS);
    return () => clearInterval(timer);
  }, [media.length]);

  return (
    <div className="hero-media" aria-hidden="true">
      {media.map((src, i) => (
        <div key={src} className={i === current ? "hero-layer is-on" : "hero-layer"}>
          {isVideo(src) ? (
            <video src={src} autoPlay muted loop playsInline preload={i === 0 ? "auto" : "metadata"} />
          ) : (
            // la primera se carga con prioridad; las demás también de entrada,
            // para que estén listas cuando les toque aparecer
            <Image src={src} alt="" fill sizes="100vw" priority={i === 0} loading={i === 0 ? undefined : "eager"} />
          )}
        </div>
      ))}
    </div>
  );
}
