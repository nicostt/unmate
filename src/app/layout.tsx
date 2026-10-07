import type { Metadata, Viewport } from "next";
import { Figtree, Outfit } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// next/font descarga las fuentes al compilar y las sirve desde nuestro propio
// sitio (no se le pide nada a Google cuando alguien entra). Cada una queda
// disponible como variable CSS, que usa globals.css.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Lo que se ve en la pestaña del navegador, en Google y al compartir el link.
export const metadata: Metadata = {
  title: "unmate.es — Mates, bombillas y termos",
  description:
    "Mates de calabaza y algarrobo, bombillas y termos. Armá tu pedido y cerralo por WhatsApp.",
  icons: { icon: "/logo.webp" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#220f09" },
    { media: "(prefers-color-scheme: light)", color: "#ece5de" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script de tema cambia <html> antes de que
    // React arranque, y sin esto React avisaría de esa diferencia.
    <html lang="es-AR" className={`${outfit.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
