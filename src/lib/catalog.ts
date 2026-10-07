import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { categories, products } from "@/data/catalog";
import type { Catalog } from "./types";

// Único lugar de donde la web saca el catálogo. Hoy lee el archivo local;
// cuando conectemos Supabase se cambia solo el cuerpo de esta función y el
// resto del sitio no se entera.
export async function getCatalog(): Promise<Catalog> {
  return {
    categories,
    products: products.map((p) => ({ ...p, images: imagesOf(p.slug) })),
  };
}

// Fotos de un producto: todos los archivos de imagen que haya en
// public/productos/<slug>/, ordenados por nombre (1.jpg, 2.jpg, 10.jpg...).
// La primera es la principal.
const PHOTOS_DIR = path.join(process.cwd(), "public", "productos");

function imagesOf(slug: string): string[] {
  const dir = path.join(PHOTOS_DIR, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((file) => `/productos/${slug}/${file}`);
}
