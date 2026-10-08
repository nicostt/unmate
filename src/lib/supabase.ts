import { createClient } from "@supabase/supabase-js";

// Conexión a Supabase. Usa la clave "publishable", que por sí sola solo puede
// hacer lo que permiten las reglas de seguridad de la base (leer el catálogo).
// Cuando el administrador inicia sesión en /admin, esta misma conexión pasa a
// tener sus permisos (en su navegador, no en el de los demás).
// Los dos valores salen de .env.local (ver .env.example).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(URL, KEY);

// Nombre del "bucket" (carpeta raíz) de Storage donde van las fotos.
export const PHOTOS_BUCKET = "productos";

// Dirección pública de una foto a partir de su ubicación en el bucket.
export function photoUrl(path: string): string {
  return `${URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${path}`;
}

// Conexión de un solo uso que actúa en nombre de un usuario con sesión
// iniciada. La usa el servidor para comprobar quién le está pidiendo algo.
export function supabaseAs(accessToken: string) {
  return createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
