import { categories, products } from "@/data/catalog";
import type { Catalog } from "./types";

// Único lugar de donde la web saca el catálogo. Hoy lee el archivo local;
// cuando conectemos Supabase se cambia solo el cuerpo de esta función y el
// resto del sitio no se entera.
export async function getCatalog(): Promise<Catalog> {
  return { categories, products };
}
