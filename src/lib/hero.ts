import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { coverImages, type Product } from "./types";

// Qué se muestra de fondo en la portada.
//
// Lo definitivo son VIDEOS: se copian a la carpeta public/hero/ (formato
// .mp4 o .webm) y aparecen solos, en orden de nombre (1.mp4, 2.mp4...),
// fundiéndose uno en otro. Conviene que sean cortos (8 a 15 segundos), sin
// sonido y livianos (2 o 3 MB cada uno), porque los baja cada visitante.
//
// Mientras esa carpeta esté vacía, se usan como relleno las fotos de los
// primeros productos que tengan foto.
const HERO_DIR = path.join(process.cwd(), "public", "hero");

// Cuántas fotos de relleno se usan cuando no hay videos.
const FALLBACK_PHOTOS = 2;

export function getHeroMedia(products: Product[]): string[] {
  if (existsSync(HERO_DIR)) {
    const videos = readdirSync(HERO_DIR)
      .filter((file) => /\.(mp4|webm)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
      .map((file) => `/hero/${file}`);
    if (videos.length) return videos;
  }
  return products
    .map((p) => coverImages(p)[0])
    .filter(Boolean)
    .slice(0, FALLBACK_PHOTOS);
}

