import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

// Cómo guarda la caché de Next el adaptador de Cloudflare (OpenNext).
// Es la receta que recomienda la guía para un sitio chico que se actualiza:
// https://opennext.js.org/cloudflare/caching
//  - incrementalCache: las páginas y el catálogo ya armados, en R2;
//  - queue: regenera en segundo plano lo que venció (cacheLife "minutes");
//  - tagCache: anota cuándo el panel pidió refrescar el catálogo (updateTag).
// Los nombres de cada cosa están en wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 2 }),
});
