import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

// Panel de administración. Esta página en sí no tiene nada secreto: todo lo
// que muestra y modifica pasa por las reglas de seguridad de Supabase, que
// solo le dejan escribir al usuario administrador con sesión iniciada.
export const metadata: Metadata = {
  title: "Panel — unmate.es",
  robots: { index: false, follow: false }, // que Google no la liste
};

export default function AdminPage() {
  return <AdminApp />;
}
