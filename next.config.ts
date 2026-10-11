import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Videos de la portada, foto del final de la página y foto de "Quién soy".
// Se buscan en la carpeta public/ UNA vez, al compilar (o al arrancar
// `npm run dev`), y quedan anotados en la versión que se publica: en el
// servidor esa carpeta no está a mano mientras la web corre.
// Después de agregar o quitar un archivo hay que reiniciar `npm run dev`.
// Los usa src/lib/hero.ts.
const PUBLIC = path.join(process.cwd(), "public");
const HERO_DIR = path.join(PUBLIC, "hero");

const heroVideos = existsSync(HERO_DIR)
  ? readdirSync(HERO_DIR)
      .filter((file) => /\.(mp4|webm)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
      .map((file) => `/hero/${file}`)
  : [];

const endImage = ["final.webp", "final.jpg", "final.jpeg", "final.png"].find((file) =>
  existsSync(path.join(PUBLIC, file)),
);

const aboutPhoto = ["quien-soy.webp", "quien-soy.jpg", "quien-soy.jpeg", "quien-soy.png"].find((file) =>
  existsSync(path.join(PUBLIC, file)),
);

// ---------------------------------------------------------------- seguridad
// Cabeceras que el servidor manda con cada página. Le dicen al navegador qué
// tiene permitido hacer la web, para que un error nuestro (o un intento de
// ataque) no pase a mayores.
const SUPABASE = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
const DEV = process.env.NODE_ENV !== "production";

// Content-Security-Policy: la lista de lugares de donde la página puede
// cargar cosas. Todo lo que no esté acá, el navegador lo bloquea. Si algún
// día se suma algo de afuera (videos de YouTube, Mercado Pago, un mapa), hay
// que agregarlo en el renglón que corresponda.
const CSP = [
  "default-src 'self'", // por defecto, solo nuestra propia web
  // scripts: los nuestros. 'unsafe-inline' hace falta porque Next escribe scripts dentro de la página
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`, // fotos: las nuestras y las de Supabase
  "media-src 'self'", // videos: solo los de public/
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE}${DEV ? " ws: wss:" : ""}`, // a dónde puede mandar o pedir datos
  "frame-src 'none'", // la web no incrusta otras páginas
  "frame-ancestors 'none'", // y nadie puede incrustarnos a nosotros (evita el "clickjacking")
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // siempre por https, también los subdominios, durante dos años
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // que el navegador no "adivine" el tipo de un archivo
  { key: "X-Content-Type-Options", value: "nosniff" },
  // lo mismo que frame-ancestors, para navegadores viejos
  { key: "X-Frame-Options", value: "DENY" },
  // al ir a otro sitio (WhatsApp, Instagram) se le cuenta de qué web viene, pero no de qué página
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // la web no usa cámara, micrófono ni ubicación: quedan apagados
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // no anunciar con qué está hecha la web
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    HERO_VIDEOS: JSON.stringify(heroVideos),
    END_IMAGE: endImage ? `/${endImage}` : "",
    ABOUT_PHOTO: aboutPhoto ? `/${aboutPhoto}` : "",
  },
  images: {
    // Las fotos de productos viven en Supabase Storage: hay que autorizar
    // ese servidor para que Next las pueda achicar y servir optimizadas.
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
