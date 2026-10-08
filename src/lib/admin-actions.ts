"use server";

import { updateTag } from "next/cache";
import { supabaseAs } from "./supabase";

// Le avisa a la web pública que el catálogo cambió, para que deje de mostrar
// la copia guardada y lo vuelva a leer de la base. El panel la llama después
// de cada cambio. Corre en el servidor, y antes de hacer nada comprueba que
// quien la llama sea el administrador.
export async function refreshCatalog(accessToken: string) {
  const { data: isAdmin } = await supabaseAs(accessToken).rpc("is_admin");
  if (isAdmin !== true) throw new Error("No autorizado");
  updateTag("catalog");
}
