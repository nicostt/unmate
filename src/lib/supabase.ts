import { createClient } from "@supabase/supabase-js";

// Conexión pública a Supabase. Usa la clave "publishable", que solo puede
// hacer lo que permiten las reglas de seguridad de la base (leer el catálogo).
// Los dos valores salen de .env.local (ver .env.example).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
