# unmate.es — tienda de mates

## Qué es
Tienda online de mates, bombillas y termos. Hoy es un catálogo con carrito que arma el pedido y lo manda por WhatsApp. El dueño del proyecto es Nicolás y es su primer proyecto web real. Idioma de trabajo: español rioplatense informal.

## Cómo trabajar con Nicolás
- Quiere una web profesional, escalable y que pueda mantener sin depender de una IA. Explicá cada pieza, dejá un README claro y usá herramientas estándar y bien documentadas.
- Todas las cuentas (GitHub, Supabase, hosting) van a su nombre. No crees cuentas ni manejes sus contraseñas.
- Ofrecele escribir partes él mismo (por ejemplo el formulario del panel) y revisalas.
- Nunca le pidas claves secretas por chat.

## Decisiones tomadas
- Stack: Next.js + Supabase (Postgres, Auth, Storage).
- Hosting: Vercel Hobby prohíbe uso comercial (verificado en su documentación, octubre 2026). Revisar los términos de Cloudflare Pages o Netlify antes de lanzar.
- Sin cuentas de clientes por ahora. Un solo rol de administrador (Nicolás) con login.
- Pedidos: el cliente arma el carrito y se envía todo por WhatsApp (+54 9 3364 34-8318, wa.me/5493364348318). Registrar cada pedido en una tabla `orders` con número desde el día uno.
- Etapas: 1) base: repositorio, diseño migrado, productos y categorías en la base, panel admin con login, fotos y videos en Storage. 2) pedidos por WhatsApp registrados con estados. 3) pagos con Mercado Pago. 4) envíos y facturación (esto último se consulta con un contador).
- Mantener Tiendanube (unmatees.mitiendanube.com) como respaldo hasta que la web nueva esté completa.

## Estado (actualizar al avanzar)
- 7/10/2026: proyecto Next.js 16 creado (App Router, TypeScript, CSS plano, sin Tailwind). Diseño migrado y verificado. Supabase creado por Nicolás y conectado (`.env.local`): `getCatalog()` en `src/lib/catalog.ts` lee `categories` y `products` con "use cache" (tag `catalog`). SQL de `supabase/` ejecutado y verificado: lectura pública OK, escritura anónima rechazada, signup apagado.
- Fotos: tabla `product_media` + bucket `productos` de Storage; `Gallery.tsx` las muestra deslizables. Botón de modo claro/oscuro en el header.
- Panel en `/admin` (`src/components/admin/`): todo del lado del navegador con supabase-js (sesión en localStorage); la seguridad es la RLS. Tras cada cambio llama a la server action `refreshCatalog` (updateTag `catalog`). Claude no puede iniciar sesión (no maneja la contraseña): los flujos con login los prueba Nicolás.
- GitHub: `https://github.com/nicostt/unmate.git` (rama `main`). Nicolás quiere commit antes de cambios grandes y ver la web en vivo mientras se edita.
- Panel admin (pedido por Nicolás): modificar stock y precios, agregar y eliminar productos, subir/cambiar fotos, y mostrar u ocultar un producto (columna `is_active`).
- Hosting (revisado 7/10/2026): Netlify Free permite proyectos comerciales según su anuncio oficial del plan; hoy es por créditos (300/mes) y el sitio se pausa si se agotan. Cloudflare no prohíbe uso comercial en el plan gratis, pero su acuerdo (2.2.1 h) prohíbe procesar o recolectar datos de tarjeta en sitios con servicio gratis (no nos afecta mientras el pago sea el checkout de Mercado Pago) y Next.js ahí corre con un adaptador ("vinext") con compatibilidad parcial. Preferencia: Netlify; confirmar soporte de Next 16 al publicar.
- Dominios (7/10/2026): `unmate.es` ya está registrado por alguien (DNS en dondominio.com); `unmate.com.ar` no tiene DNS, probablemente libre (confirmar en nic.ar).
- Ramas: se trabaja y se sube a `dev`; `main` es lo que publica Netlify (15 créditos por publicación) y solo se actualiza cuando Nicolás pide publicar.
- Yerba: se vende suelta por peso. Regla: todo producto de la categoría con slug `yerba` es por peso (`WEIGHT_CATEGORY` en `src/lib/types.ts`): `price` = precio del kilo, `stock` = gramos, y en el carrito la cantidad son gramos (pasos de 250). El panel tiene una sección Yerba aparte con formulario corto. Nicolás descartó el sistema de presentaciones por engorroso: la tabla `product_variants` (migración 0002, ya ejecutada) quedó creada pero sin uso. Categorías editables desde el panel.
- 8/10/2026, en `dev`, sin publicar. UN SOLO SQL pendiente de que Nicolás lo ejecute: `supabase/migrations/0003_pedidos_disenos_estadisticas.sql` (el viejo `0003_pedidos.sql` quedó marcado NO EJECUTAR; no se pudo borrar). Hasta que lo corra, la tienda local en `dev` da error porque `getCatalog()` ya lee `by_design` y `product_designs`. Contiene:
  - Pedidos: `orders`, `order_items`, `create_order` (la llama la tienda, `src/lib/orders.ts`; si falla, WhatsApp se abre igual sin número) y `set_order_status` (confirmar descuenta stock numérico, cancelar lo devuelve). Panel: pestaña Pedidos (`Orders.tsx`).
  - Diseños: `products.by_design` + `product_designs` + `product_media.design_id`. Cada unidad de un mate es una pieza única con número y hasta 4 fotos; mismo precio para todos. Carrito: key `slug#idDiseño`. Decisión de Nicolás: un diseño pedido NO se borra solo, en el panel aparece marcado "Pedido en #N" y él lo elimina a mano (ahí sale de la tienda). Panel: `DesignManager.tsx`.
  - Estadísticas anónimas: `events`, `carts`, funciones `track` y `save_cart` (`src/lib/track.ts`; no cuenta localhost ni navegadores con sesión de admin). Panel: pestaña Estadísticas (`Stats.tsx`, cálculo en `stats-data.ts`): embudo, personas por día, interés sin compra, carritos sin terminar, diseños más elegidos, agotados con visitas, búsquedas sin resultado, origen, dispositivo, horarios, más vendidos. Cuenta personas distintas, no clics.
  - También en `dev`: marca nueva (emblema `public/logo-mark.png` como máscara CSS, favicon `src/app/icon.png`), tarjetas que se levantan y pasan fotos solas con el mouse, "cómo comprar" desplegable, flechas para ordenar productos.
  - Nada de lo que requiere login fue probado por Claude: lo prueba Nicolás.
- 9/10/2026, en `dev`, sin publicar. El SQL 0003 YA fue ejecutado y verificado (pedido de prueba #2 creado por Claude; Nicolás lo borra). SQL NUEVO pendiente de que lo ejecute: `supabase/migrations/0004_precios_yerba_y_resenas.sql` (tabla `settings` con `yerba_tiers`, tabla `reviews`, y `create_order` actualizado). La tienda tolera que falte: sin él no hay tramos ni reseñas, pero no se rompe.
  - Yerba por tramos: precio base por kilo en cada yerba + ajuste en % según cantidad, global para todas (`weightPrice`/`tierFor` en `src/lib/types.ts`; se redondea a $ 10; la base hace la misma cuenta). Panel: pestaña Yerba, bloque "Precio según la cantidad" (`YerbaPricing.tsx`).
  - Avisos de stock: `stockLabel` → "Últimas 3", "Últimas 2", "Última unidad", "Agotado"; con más de 3 no dice nada.
  - Diseños en la tienda: Nicolás no quiso el texto "Diseño #N · X disponibles". La tarjeta muestra contador "2 / 3", etiqueta "Pieza única" y el aviso de stock. El número de diseño solo aparece en carrito, WhatsApp y panel.
  - Panel: pestañas Productos, Yerba, Pedidos, Estadísticas, Reseñas. Fotos: `DropZone.tsx` (elegir, arrastrar o pegar con Ctrl+V con el mouse encima).
  - Reseñas: las carga Nicolás (nombre, fotos, texto opcional) y salen al final de la tienda (`Reviews.tsx`); sin reseñas la sección no aparece.
  - Guía de tipos de mate interactiva (`MateTypes.tsx`): solo el nombre; se abre con el mouse y queda fija con clic. Usa dibujos y textos provisorios hasta que Nicolás pase fotos y textos.
  - Buscador sin resultados: cartel con botón a WhatsApp que incluye lo que se buscó.
- 9/10/2026 (tarde), en `dev`, sin publicar. SQL 0004 ya ejecutado. SQL NUEVO pendiente: `supabase/migrations/0005_yerba_por_producto_y_resenas.sql`. OJO: hasta que Nicolás lo corra la tienda local da error (el catálogo ya lee `by_weight`). Cambios:
  - Yerba: ya NO depende de la categoría ni de `settings`. Cada producto tiene `by_weight` (yerba suelta, por peso) o no (paquete, por unidad), y su ajuste propio `weight_extra` (% más caro bajo 1 kg) y `weight_discount` (% más barato desde 2 kg): `weightTiers()` en `src/lib/types.ts`. Nicolás pidió que fuera simple (dos preguntas) y por yerba, dentro de Editar (`YerbaPricing.tsx` es parte del formulario). Panel, pestaña Yerba: lista "Yerba suelta" y lista "Paquetes". La fila `yerba_tiers` de `settings` quedó sin uso.
  - Reseñas: `avatar` (foto del cliente junto al nombre) y `featured` (portada). En la tienda se ve la portada y un botón "Ver todas / Ver menos"; tarjetas de alto libre que cambian según tengan foto, frase corta o texto largo.
  - "Armá tu equipo" rediseñado: tres pestañas (Mate, Bombilla, Termo) con tarjetas con foto; los mates por diseños muestran una tarjeta por pieza.
  - La guía se separó en dos secciones destacadas: `ChooseGuide` ("¿Cuál es tu mate?", arriba del catálogo) y `CureGuide` ("Cómo curarlo", después de las reseñas). El orden de la página está en `src/app/page.tsx`.
  - Nicolás pidió volver al brillo y zoom originales de las tarjetas al pasar el mouse; se mantuvo el efecto de "llenado" verde en las opciones.
- 9/10/2026 (noche), en `dev`, sin publicar. SQL 0005 ya ejecutado. SQL 0006 ejecutado y verificado el 9/10/2026 (rechaza pedidos sin stock). No queda ningún SQL pendiente. Orden de la página: portada, tipos de mate, catálogo, equipo, curado, reseñas, contacto.
  - Pedidos (decisión final de Nicolás, 9/10/2026): CONFIRMAR baja el stock (unidades o gramos; un diseño queda apartado con `is_hidden` y deja de ofrecerse). ENTREGAR es definitivo: el stock queda descontado, los diseños se eliminan y el pedido pasa a la pestaña Vendidos; un entregado ya no cambia de estado y borrarlo del historial no devuelve stock. CANCELAR un confirmado devuelve el stock. Un cancelado se puede reabrir como confirmado (vuelve a descontar) o como pendiente. `create_order` rechaza pedidos sin stock con el mensaje `SIN_STOCK:<producto>`; la tienda avisa y no abre WhatsApp. El pedido se titula con el nombre del cliente ("Pedido Juan") y se puede renombrar desde el panel. `Orders.tsx` tiene `mode` "open" (Pedidos) y "sold" (Vendidos). OJO: el archivo 0006 se reescribió antes de que Nicolás lo ejecutara; incluye también `create_order`.
  - "Armá tu equipo": tres casilleros; cada uno abre una ventana (modal) con las fotos para elegir, así la sección no crece con el stock.
  - Efecto de aparecer al bajar: atributo `data-reveal` + `Reveal.tsx` (revisa posiciones al hacer scroll; no usa IntersectionObserver). El catálogo no lo lleva, a pedido.
  - Reseñas: tarjetas chicas tipo comentario (nombre y foto arriba, texto en serif cursiva, fotos en miniatura), portada de 5 como máximo.
  - Botón "¿Querés saber cómo curarlos?" en la sección de tipos de mate. Se quitó el destello verde de las secciones destacadas.
- 9/10/2026: cartel "¿No encontrás lo que buscabas?" centrado y con botón grande de WhatsApp; el clic se anota como evento `search` con `value: -1` (sin cambio de esquema) y aparece en Estadísticas como "Preguntaron por WhatsApp". Estadísticas reorganizadas en grupos, con la explicación de cada gráfico detrás de un "?" (`StatsView` es la parte de dibujo). Botones a WhatsApp e Instagram con los colores e íconos de cada app (`.btn.wa`, `.btn.ig`, `BrandIcons.tsx`). Existe una página SOLO LOCAL `src/app/stats-preview/page.tsx` con datos inventados para ver cómo quedan las estadísticas; está excluida en `.git/info/exclude` y NO debe commitearse ni publicarse.
- PUBLICADO el 9/10/2026: `main` = commit `2471ba1`, verificado en https://unmatees.lat (tienda, panel, fotos optimizadas, favicon; `/stats-preview` no existe ahí). Fue la 7.ª publicación del mes (105 de 300 créditos, como mínimo). La dirección `shiny-hamster-7b8446.netlify.app` ya no responde y la consulta pública de deploys devuelve 401 (el proyecto parece haber sido renombrado): para verificar una publicación, mirar directamente `unmatees.lat`. No queda ningún SQL pendiente. Las estadísticas empiezan a contar desde esta publicación.
- 10/10/2026, en `dev`, SIN PUBLICAR (Nicolás pidió esperar a tener el material pendiente para publicar todo junto y no gastar créditos). Nicolás reportó que "Abrieron un producto" y "Agregaron al carrito" no andaban: se verificó dato por dato en unmatees.lat que la tienda envía y la base acepta visit/view/add/search/save_cart/create_order. La causa era que el navegador con sesión de admin está excluido del conteo. Cambios: interruptor "Contar también lo que hago yo" (`COUNT_ME_KEY` en `src/lib/track.ts`), botones Actualizar y Borrar estadísticas en la pestaña. Orden de la página: portada, catálogo, tipos de mate, equipo, curado, reseñas, contacto. Fotos de reseñas a 150 px. En la base quedaron datos de prueba de Claude: visitante `prueba-claude-0001`, origen `prueba`/`prueba-claude`, búsqueda "prueba claude" y el Pedido #14 "PRUEBA estadisticas Claude (borrar)".
- 10/10/2026, en `dev`, sin publicar: PRUEBA de portada con fondo a pantalla casi completa estilo NEBEN (`Hero.tsx` + `HeroMedia.tsx`, clase `.hero-video`): fondos apilados que se funden cada 7 s, velo oscuro, título centrado en dos colores. `src/lib/hero.ts` usa los videos de `public/hero/*.mp4|webm` si existen; hoy la carpeta no existe y se usan como relleno las fotos de los dos primeros productos, con zoom lento. Nicolás la APROBÓ el 10/10/2026 (le encantó el fundido); las fotos son solo relleno y falta que pase los dos videos (alguien tomando mate; un mate cebándose). No publicar hasta que él lo pida. La portada anterior (logo en tarjeta a la derecha) quedó en el historial de git. Encabezado compactado en celulares (el botón del carrito muestra solo ícono y número).
- Legales: Nicolás decidió no poner botón de arrepentimiento ni datos fiscales mientras todo se cierre por WhatsApp. Replantear al sumar Mercado Pago.
- Dominio: Nicolás compró `unmatees.lat` en Namecheap (quería el .com y eligió .lat por error; decidió usarlo igual) y lo conectó a Netlify con Netlify DNS el 8/10/2026. Ese día `unmatees.com` y `unmate.lat` estaban libres; `unmate.es` lo tiene registrado un conocido suyo.
- Netlify: publicado en https://shiny-hamster-7b8446.netlify.app (publica `main` automáticamente). Requiere `netlify.toml` con el plugin `@netlify/plugin-nextjs` declarado: sin eso Netlify no activaba el adaptador y todo daba 404. El estado de una publicación se consulta sin login en `https://api.netlify.com/api/v1/sites/shiny-hamster-7b8446.netlify.app/deploys?per_page=1` (mirar `state` y `plugin_state`). Al 7/10/2026 se usaron 6 publicaciones (90 de 300 créditos del mes).
- Pendiente de contenido: videos de curado (YouTube incrustado, cuando Nicolás los tenga) y descripciones nuevas de los mates (él pasa los textos).
- 8/10/2026: Nicolás quiere evaluar y acordar varios cambios grandes antes de construir nada (incluida una base de datos alternativa que le recomendaron). No arrancar a programar esas ideas sin haberlas conversado y acordado con él.
- Next 16 cambió APIs: consultar `node_modules/next/dist/docs/` antes de escribir código (ver `AGENTS.md`).

## Seguridad
- Row Level Security activada en todas las tablas: el público solo lee el catálogo, solo el admin escribe.
- La clave secreta (service role) nunca va en el repositorio ni en el navegador. `.env.local` va en `.gitignore`.
- Nunca manejar datos de tarjeta. Los pagos van por el checkout de Mercado Pago.

## Marca y diseño
- Logo: arco con un mate y bombilla adentro, blanco sobre marrón oscuro.
- Tema oscuro (principal): fondo #220f09, superficie #2d1810, texto #f6efe9, texto apagado #c0afa3, acento verde yerba #aac56b.
- Tema claro: fondo #ece5de, texto #220f09, acento #4d6820.
- Fuentes: Outfit (títulos) y Figtree (texto).
- Estilo: moderno, líneas finas, precios grandes y claros, descuentos con badge.
- Referencia visual y de contenido: `referencia/unmate.html`. Incluye catálogo con filtros, carrito que arma el mensaje de WhatsApp, "Armá tu equipo" y guía de curado.

## Productos actuales (ARS, tomados de Tiendanube)
| Producto | Categoría | Precio |
|---|---|---|
| Camionero Premium (calabaza, cuero labrado, alpaca cincelada, base de bronce; última unidad) | Mates | 34.900 (antes 41.900) |
| Torpedo Criollo con base regulable | Mates | 24.000 (antes 26.500) |
| Ranchero vaquita | Mates | 25.900 |
| Criollo coquito | Mates | 22.900 |
| Imperial de algarrobo | Mates | 20.900 |
| Camionero criollo de calabaza | Mates | 19.900 |
| Camionero de algarrobo | Mates | 18.900 |
| Bombillón semicurvo premium | Bombillas y bombillones | 23.800 |
| Bombillón recto | Bombillas y bombillones | 20.800 |
| Bombilla pico loro en bronce | Bombillas y bombillones | 7.000 |
| Bombilla pico loro | Bombillas y bombillones | 7.000 |
| Termo 1,2 L | Termos | 35.000 |

## Pendiente de Nicolás
- Fotos de todos los productos y videos de curado (calabaza y algarrobo).
- Material de "Criollo coquito", descripciones y medidas.
- Stock real, condiciones de envío, medios de pago y cuotas.
- Si hace personalizados, regalos o venta por mayor.
- Legales: botón de arrepentimiento y datos fiscales visibles. Dominio a definir (revisar `unmate.es` y `unmate.com.ar`).
- En Tiendanube el termo figura con el nombre de una marca; en la página se llama "Termo 1,2 L".
