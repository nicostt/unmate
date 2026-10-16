import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

// Cómo guarda la caché de Next el adaptador de Cloudflare (OpenNext).
// Sigue la receta de la guía para un sitio chico que se actualiza
// (https://opennext.js.org/cloudflare/caching), con KV en lugar de R2
// porque R2 pide pago:
//  - incrementalCache: las páginas y el catálogo ya armados, en KV. KV puede
//    tardar hasta un minuto en mostrar lo nuevo en todo el mundo, pero no
//    importa: el tagCache de abajo es exacto, y si el panel refrescó el
//    catálogo, lo viejo se descarta igual;
//  - queue: regenera en segundo plano lo que venció (cacheLife en catalog.ts);
//  - tagCache: anota cuándo el panel pidió refrescar el catálogo (updateTag).
// Los nombres de cada cosa están en wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 2 }),
});
