"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Cada cuánto se pasa al fondo siguiente.
const SWITCH_MS = 7000;

const VIDEO = /\.(mp4|webm)$/i;
const isVideo = (src: string) => VIDEO.test(src);

// Fondo de la portada: videos (o fotos) que ocupan toda la sección y se van
// fundiendo uno en otro. Todos están apilados; el que toca se hace visible y
// los demás se vuelven transparentes, y la transición es CSS.
// Los videos van sin sonido y en bucle, que es lo único que los navegadores
// dejan reproducir solos.
// Cada vez que se entra a la página, el video arranca desde el principio.
export function HeroMedia({ media }: { media: string[] }) {
  const [current, setCurrent] = useState(0);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // El video que se está viendo vuelve al segundo 0 y se reproduce: al entrar
  // a la página y también cuando el navegador la trae de su memoria (al volver
  // atrás o al regresar a la pestaña en el celular), que si no la muestra
  // donde había quedado.
  useEffect(() => {
    const restart = () => {
      const video = videos.current[current];
      if (!video) return;
      video.currentTime = 0;
      void video.play().catch(() => {});
    };
    restart();
    const onShow = (e: PageTransitionEvent) => e.persisted && restart();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [current]);

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
            <video
              ref={(el) => {
                videos.current[i] = el;
              }}
              src={src}
              // foto fija que se ve mientras el video carga: mismo nombre, terminado en .jpg
              poster={src.replace(VIDEO, ".jpg")}
              autoPlay
              muted
              loop
              playsInline
              preload={i === 0 ? "auto" : "metadata"}
              // por si el navegador no lo arrancó solo al cargar la página
              onCanPlay={(e) => void e.currentTarget.play().catch(() => {})}
            />
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
