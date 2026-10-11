import { coverImages, type Product } from "./types";

// Imágenes fijas de la página que se guardan en la carpeta public/: el fondo
// de la portada, el del final y la foto de "Quién soy".
// La lista de archivos la arma next.config.ts mirando la carpeta public/ al
// compilar; acá solo se decide qué mostrar.

// PORTADA. Lo definitivo son VIDEOS: se copian a la carpeta public/hero/
// (formato .mp4 o .webm) y aparecen solos, en orden de nombre (1.mp4,
// 2.mp4...), fundiéndose uno en otro. Conviene que sean cortos (8 a 15
// segundos), sin sonido y livianos (2 o 3 MB cada uno), porque los baja cada
// visitante.
// Mientras esa carpeta esté vacía, se usan como relleno las fotos de los
// primeros productos que tengan foto.
const HERO_VIDEOS: string[] = JSON.parse(process.env.HERO_VIDEOS || "[]");

// Cuántas fotos de relleno se usan cuando no hay videos.
const FALLBACK_PHOTOS = 2;

export function getHeroMedia(products: Product[]): string[] {
  if (HERO_VIDEOS.length) return HERO_VIDEOS;
  return products
    .map((p) => coverImages(p)[0])
    .filter(Boolean)
    .slice(0, FALLBACK_PHOTOS);
}

// FINAL DE LA PÁGINA. Una sola foto, a pantalla completa, detrás del pie.
// PENDIENTE: Nicolás tiene que elegirla. Se guarda como public/final.jpg
// (o .webp / .png) y aparece sola. Mientras no esté, va de relleno la foto
// de un producto.
const END_IMAGE = process.env.END_IMAGE || null;

export function getEndImage(products: Product[]): string | null {
  if (END_IMAGE) return END_IMAGE;
  const covers = products.map((p) => coverImages(p)[0]).filter(Boolean);
  return covers[FALLBACK_PHOTOS] ?? covers[0] ?? null;
}

// QUIÉN SOY. La foto de Nicolás para esa sección (src/components/site/About.tsx).
// Se guarda como public/quien-soy.jpg (o .webp / .png). null = todavía no está.
export function getAboutPhoto(): string | null {
  return process.env.ABOUT_PHOTO || null;
}
