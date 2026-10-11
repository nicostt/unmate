import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Videos de la portada y foto del final de la página.
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

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    HERO_VIDEOS: JSON.stringify(heroVideos),
    END_IMAGE: endImage ? `/${endImage}` : "",
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
