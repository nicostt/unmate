# unmate.es — tienda de mates

## Qué es
Tienda online de mates, bombillas, yerba y termos. El cliente arma un carrito y el pedido se manda por WhatsApp, quedando registrado en la base. El dueño del proyecto es Nicolás y es su primer proyecto web real. Idioma de trabajo: español rioplatense informal.

## Cómo trabajar con Nicolás
- OJO: el dueño de la tienda y quien firma "Quién soy" es **Emanuel Soto** (Villa Constitución). "Nicolás" es como figura la cuenta de esta compu.
- Textos que escribe Emanuel (tipos de mate, curado, Quién soy): se usan con SUS palabras. Solo se permiten tildes, mayúscula inicial y puntos; nunca reescribir ni cambiar palabras (pedido del 24/10/2026).
- Quiere una web profesional, escalable y que pueda mantener sin depender de una IA. Explicá cada pieza, mantené el README al día y usá herramientas estándar y bien documentadas.
- Todas las cuentas (GitHub, Supabase, hosting) van a su nombre. No crees cuentas ni manejes sus contraseñas.
- Ofrecele escribir partes él mismo y revisalas.
- Nunca le pidas claves secretas por chat.
- Commit antes de cada cambio grande, y la web andando en vivo (`unmate-dev` en `.claude/launch.json`, puerto 3000) mientras se edita.
- Los cambios grandes o las tandas de ideas se conversan y se acuerdan antes de programar.
- Claude no puede iniciar sesión en el panel (no maneja la contraseña): todo lo que requiere login lo prueba Nicolás.
- Reseñas: solo reales, las carga él. No inventar.

## Decisiones tomadas
- Stack: Next.js 16 (App Router, TypeScript, CSS plano, sin Tailwind) + Supabase (Postgres, Auth, Storage). Next 16 cambió APIs: consultar `node_modules/next/dist/docs/` antes de escribir código (ver `AGENTS.md`).
- Sin cuentas de clientes. Un solo rol de administrador (Nicolás) con login; el registro de usuarios está apagado.
- Pedidos por WhatsApp (+54 9 3364 34-8318, wa.me/5493364348318), registrados en `orders` con número.
- Etapas: 1) base, HECHA. 2) pedidos con estados, HECHA. 3) pagos con Mercado Pago. 4) envíos y facturación (se consulta con un contador).
- Legales: sin botón de arrepentimiento ni datos fiscales mientras todo se cierre por WhatsApp. Replantear al sumar Mercado Pago.
- Mantener Tiendanube (unmatees.mitiendanube.com) como respaldo hasta que la web nueva esté completa.

## Publicación
- DOMINIO: https://unmatees.com.ar (NIC.ar a nombre de Nicolás, registrado y delegado a Cloudflare el 19/10/2026: nameservers barbara y kaiser.ns.cloudflare.com; dominio personalizado del Worker). www.unmatees.com.ar redirige a la versión sin www (redirects() en next.config.ts). Se renueva cada año en NIC.ar.
- HOSTING ACTUAL: Cloudflare Workers, https://unmate.nicosoto1171.workers.dev (respaldo), publicado desde la rama `cloudflare` (Workers Builds conectado a GitHub, cuenta de Nicolás; cada `git push` a esa rama publica solo). Netlify ya no existe: Nicolás borró el proyecto (~19/10/2026). Pendiente: unificar ramas (que `cloudflare` pase a ser la de trabajo/publicación) y acordar con Nicolás si cada push publica o se sigue publicando de a tandas con "publicá".
- Ramas (hasta la mudanza): se trabajaba en `dev`; `main` lo publicaba Netlify y SOLO se actualizaba cuando Nicolás decía "publicá".
- Netlify Free (permite uso comercial; Vercel Hobby lo prohíbe): 300 créditos por mes, 15 por publicación; si se agotan el sitio se pausa. Por eso se publica de a tandas.
- MUDANZA A CLOUDFLARE EN PRUEBA (pedida el 16/10/2026: no quiere el sistema de créditos de Netlify; además las visitas gastan créditos por el video). Rama `cloudflare` (sale de `dev`): adaptador `@opennextjs/cloudflare` 1.20.12 + `wrangler`, `wrangler.jsonc`, `open-next.config.ts` (KV + DO queue + DO sharded tag cache; R2 descartado porque Cloudflare pide pago para activarlo; por el límite de 1000 escrituras diarias de KV gratis, `getCatalog` pasó a `cacheLife("hours")`: todo cambio del panel, incluidos los pedidos, refresca al instante igual), `public/_headers`; Next subió a 16.4.2 porque el adaptador lo pide. Se prueba en la compu con `npm run preview` (puerto 8787, config `unmate-cloudflare` en launch.json). KV `unmate-cache` creado por Nicolás (ID en `wrangler.jsonc`). Las variables de Supabase van en `.env.production` (las cargadas en el panel de Cloudflare no llegaban al armado). IMPORTANTE (19/10/2026): con `cacheComponents` la portada se colgaba en Workers al rearmarse (error conocido: vercel/next.js#94880, opennextjs-cloudflare#1450); se apagaron `cacheComponents` y `partialPrefetching` y el catálogo pasó a `unstable_cache` (tag `catalog`, 1 h) + `revalidate = 3600` en `page.tsx`; `refreshCatalog` hace `updateTag` + `revalidatePath("/")`. Verificado en vivo: portada, fotos (achicadas por el servicio de imágenes), video, panel, 404 y cabeceras. FALTA que Nicolás pruebe el panel con login y que un cambio del panel se vea al instante en la tienda. `npm audit` marca 9 avisos "high" que vienen solo con el adaptador (glob y braces, herramientas que se usan al construir, no en la web publicada).
- `netlify.toml` declara `@netlify/plugin-nextjs`. Sin eso el adaptador no se activa y todo da 404.
- Dirección: https://unmatees.netlify.app (gratis, de Netlify). El dominio `unmatees.lat` (Namecheap) lo canceló y reembolsó el registrador en octubre de 2026 porque no se respondió el mail de verificación: ya no existe. Si Nicolás compra otro, se agrega en Netlify > Domain management y verifica el mail del registrador el mismo día. `unmate.es` lo tiene registrado un conocido suyo.
- Para verificar una publicación, mirar directamente https://unmatees.netlify.app (la consulta pública de deploys devuelve 401).
- Publicado: `main` = `dev` al 16/10/2026 (8.ª publicación del mes): incluye todo lo de abajo. Lo que siga en `dev` espera otro "publicá".
- Respaldo de antes de esa tanda: etiqueta `respaldo-antes-de-ideas` y rama `respaldo/antes-de-ideas` (commit `560ed7b`). Si algo no gusta, se vuelve desde ahí.

## Cómo está armado
Mapa de carpetas y de estilos: ver `README.md`. Lo que no se ve leyendo el código:

- **Catálogo:** `getCatalog()` en `src/lib/catalog.ts`, con "use cache" (tag `catalog`). El panel, tras cada cambio, llama a la server action `refreshCatalog` (`src/lib/admin-actions.ts`).
- **Panel (`/admin`, `src/components/admin/`):** corre entero en el navegador con supabase-js (sesión en localStorage). La seguridad es la RLS. Pestañas: Productos, Yerba, Pedidos, Vendidos, Estadísticas, Reseñas.
- **Estilos:** `src/styles/`, un archivo por zona, unidos en orden por `index.css`. `admin.css` solo lo importa `src/app/admin/page.tsx`. El orden de los archivos importa (gana la regla de más abajo).
- **Modos de venta** (toda la cuenta está en `src/lib/types.ts`):
  - Por unidad: precio fijo, stock en unidades.
  - Por peso (`by_weight`, yerba suelta): `price` es el kilo, `stock` son gramos, pasos de 250 g. Cada yerba tiene `weight_extra` (% más caro bajo 1 kg) y `weight_discount` (% más barato desde 2 kg); se redondea a $ 10 y la base hace la misma cuenta. Los paquetes de yerba se venden por unidad.
  - Por diseños (`by_design`): cada unidad es una pieza única con número y hasta 4 fotos (`product_designs`, `product_media.design_id`); mismo precio para todas. Clave de carrito `slug#idDiseño`. En la tienda no se muestra "Diseño #N": la tarjeta dice "2 / 3" y "Pieza única"; el número solo aparece en carrito, WhatsApp y panel.
- **Avisos de stock:** "Últimas 3", "Últimas 2", "Última unidad", "Agotado"; con más de 3 no dice nada.
- **Pedidos:** `create_order` (la llama `src/lib/orders.ts`) recalcula precios y rechaza lo que no tiene stock con `SIN_STOCK:<producto>`; la tienda avisa y no abre WhatsApp. Estados (`set_order_status`): CONFIRMAR baja el stock (un diseño queda apartado con `is_hidden`). ENTREGAR es definitivo: los diseños se eliminan, el pedido pasa a Vendidos y ya no cambia de estado. CANCELAR un confirmado devuelve el stock; un cancelado se puede reabrir como confirmado o como pendiente. El pedido se titula "Pedido de <nombre>" y se puede renombrar.
- **Estadísticas anónimas:** tablas `events` y `carts`, funciones `track` y `save_cart` (`src/lib/track.ts`). Cuentan personas distintas, no clics. No cuentan `localhost` ni el navegador con sesión de admin, salvo que se active "Contar también lo que hago yo" (`COUNT_ME_KEY`). El clic en "¿No encontrás lo que buscabas?" se anota como `search` con `value: -1`.
- **Portada:** videos de `public/hero/*.mp4|webm` en orden de nombre; si no hay, las fotos de los dos primeros productos. Se funden cada 7 s. Aprobada por Nicolás el 10/10/2026. Hoy hay un solo video, que mandó Nicolás el 22/10/2026 (reemplaza al del parque del 11/10): `1.mp4`, un mate y un termo sobre una mesa de madera frente a un patio con plantas, con una mano que ceba; 43,5 segundos (largo completo, a pedido), 832 × 464. Primero llegó por WhatsApp (832 × 464, se veía "medio medio"); después Nicolás pasó el original del celular (IMG_8192.MOV: 4K, 60 cuadros, HEVC, 241 MB). Quedó en 1920 × 1080, 30 cuadros, sin sonido, CRF 26, 8,7 MB (comando en el README). Nicolás pidió NO usar filtros de "mejora" (nitidez, limpieza de ruido, color): solo achicar y comprimir. En celulares (pantalla vertical) se ve solo una franja: `hero.css` corre el encuadre a donde está el mate (`object-position:22% 50%`, a pedido de Nicolás); si cambia el video, revisar ese número. Su foto fija `1.jpg` es el primer cuadro. Al entrar a la página (y al volver con atrás o al regresar a la pestaña, evento `pageshow`) el video arranca desde el segundo 0, a pedido de Nicolás. Con un solo video pasa entero y vuelve a empezar (`loop`); OJO: si se suma un segundo video, `HeroMedia` cambia cada 7 s (`SWITCH_MS`) y cortaría este de 43 s: habría que esperar a que termine cada uno. ffmpeg quedó instalado el 11/10/2026 con winget (`Gyan.FFmpeg.Essentials`); en la terminal de Claude no está en el PATH: usar `$LOCALAPPDATA/Microsoft/WinGet/Packages/Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe`. Los comandos para preparar un video están en el README. El original que llega por WhatsApp ya viene en 720p: para más calidad Nicolás tiene que pasar el archivo del celular por otro medio. Nicolás probó un fundido del borde de abajo del video hacia el color de la página y lo descartó (12/10/2026): el video corta en línea recta. Es un video claro (pasto a pleno sol): el texto de la portada lleva una sombra suave para leerse igual. En el termo se ve el escudo de un club de fútbol. OJO: la lista de archivos la arma `next.config.ts` AL COMPILAR (variables `HERO_VIDEOS` y `END_IMAGE`), porque en Netlify la carpeta `public/` no está a mano mientras la web corre; tras agregar un archivo hay que reiniciar el servidor de desarrollo. El título es "Un mate para" + una palabra que rota (`RotatingWord.tsx`, lista `FOR` en `Hero.tsx`).
- **Final de la página:** `Footer.tsx` ocupa toda la pantalla con una foto de fondo (`public/final.jpg|webp|png`; mientras no exista, la foto de un producto), los links y el nombre gigante cuyas letras saltan y sueltan yerba, con un contador de "mates cebados" (`FooterName.tsx`).
- **Descuento por armar equipo:** el equipo son 4 partes (`KIT_PARTS` en `src/lib/types.ts`: categorías `mates`, `bombillas`, `termos` y `yerba` en paquete; la yerba suelta no cuenta). Si el carrito trae productos de `min` partes o más, se descuenta `percent` % sobre UN producto de cada parte (el más caro), redondeado a $ 10 (`kitSaving`). Vale también si se suman sueltos al carrito, no solo desde "Armá tu equipo". El ajuste vive en la fila `kit_discount` de `settings` y se cambia en el panel (pestaña Productos, `KitDiscountForm.tsx`); la base hace la misma cuenta en `create_order` y guarda `orders.discount`. Fue decisión de Claude (Nicolás solo pidió "un descuento al armar un paquete de 3, configurable, y a partir de cuántos"): confirmar con él que la regla le sirve.
- **Buscador** (`src/lib/search.ts`): sin tildes ni mayúsculas, todas las palabras en cualquier orden, resalta lo que coincide con `<mark>`. Si nada coincide muestra "parecidos" (tolera errores de tipeo). El cartel "¿No encontrás lo que buscabas?" aparece solo si no hay ni parecidos y la persona dejó de escribir (900 ms).
- **Animaciones** (tanda del 11/10/2026, tomadas del "Muestrario de interfaces" que pasó Nicolás): encabezado que se esconde al bajar (`HideOnScroll.tsx`), producto que vuela al carrito (`src/lib/fly.ts`), foto que viaja de la tarjeta a la ficha y cambio de tema en círculo (View Transitions, `src/lib/motion.ts`), filtro con FLIP (`useFlip.ts`), carrito como hoja arrastrable en celular (`CartDrawer.tsx`), título de la pestaña que llama al irse con carrito cargado, grano de película (clase `.grain`), página 404 con ojos (`src/app/not-found.tsx`). Quien pidió "menos movimiento" ve fundidos (`src/styles/motion.css` y `reducedMotion()`).
- **Salidas animadas** (pedido de Nicolás, 11/10/2026: lo que entra con animación también tiene que irse con una): el carrito y la ventana del equipo siguen en pantalla un instante con la clase `is-closing` (`usePresence.ts`; en `KitBuilder.tsx` a mano) y recién después se sacan; la ficha de producto se va con la View Transition; y en las listas (`useFlip.ts`: catálogo, renglones del carrito, reseñas) lo que desaparece se achica y se desvanece. Para esto último `useFlip` vuelve a poner un instante en la página el elemento que React ya sacó, fijo en su lugar. Regla para lo que se agregue: si algo aparece animado, tiene que tener su salida.
- **Botón que cuenta lo que pasa** (`StateButton.tsx`, 12/10/2026): los botones de sumar al carrito (tarjeta, ficha y equipo) muestran un circulito girando y después un tilde ("Sumado") antes de volver a su texto. En la ficha y el equipo, recién después del tilde se abre el carrito.
- **Fotos de reseñas:** al tocarlas se amplían encima de la página (`PhotoZoom.tsx`), no abren otra pestaña; la miniatura se transforma en la foto grande con una View Transition.
- **Panel:** borrar pide MANTENER APRETADO un segundo (`HoldButton.tsx`) en vez de un "¿Estás seguro?"; marcar un pedido como entregado sigue preguntando con una ventana porque tiene advertencias. Los productos se ordenan arrastrando de una manija (`SortableList.tsx`), o con las flechas del teclado.
- **En el navegador de prueba de Claude** (panel oculto) las transiciones, los requestAnimationFrame y los eventos de scroll no avanzan solos: las animaciones se verifican por estado del DOM, y a Nicolás hay que pedirle que las mire.
- **Efecto de aparecer al bajar:** atributo `data-reveal` + `Reveal.tsx`, que revisa posiciones al hacer scroll (no usa IntersectionObserver). El catálogo no lo lleva, a pedido.
- **Orden de la página** (`src/app/page.tsx`): portada, catálogo, tipos de mate, equipo, curado, reseñas, quién soy, contacto.
- **"Quién soy"** (`About.tsx`, pedida el 11/10/2026): foto a un lado y texto al otro. Hoy tiene texto de relleno entre corchetes y un recuadro donde va la foto. Tiene un seguro: mientras `ABOUT.ready` sea `false`, la sección se ve en `npm run dev` pero NO en la web publicada. Cuando Nicolás mande el texto y la foto: cargar el texto en `ABOUT`, guardar la foto como `public/quien-soy.jpg` (la detecta `next.config.ts`, hay que reiniciar el servidor) y pasar `ready` a `true`.
- **Solo local:** `src/app/stats-preview/page.tsx` muestra las estadísticas con datos inventados. Está excluida en `.git/info/exclude`; NO commitear ni publicar.

## Base de datos
- Migraciones en `supabase/migrations/`. De 0001 a 0008: ejecutadas por Nicolás y verificadas (la 0008, refuerzos de seguridad, el 12/10/2026). El descuento arranca apagado (0 %): lo prende Nicolás desde el panel. Claude no puede ejecutar SQL: cada cambio de esquema es un archivo nuevo que corre Nicolás en el SQL Editor.
- Sin uso: tabla `product_variants` (0002; Nicolás descartó las "presentaciones" por engorrosas) y la fila `yerba_tiers` de `settings` (0004).
- Datos de prueba que dejó Claude y Nicolás tiene que borrar: Pedido #14 "PRUEBA estadisticas Claude (borrar)", quizá "PRUEBA de Claude (borrar)", y en estadísticas el visitante `prueba-claude-0001`, orígenes `prueba`/`prueba-claude` y la búsqueda "prueba claude".

## Seguridad
ES PRIORIDAD (pedido de Nicolás, 11/10/2026): en cada cambio se repasa esta lista antes de darlo por terminado, y se le cuenta qué se revisó.

Reglas:
- Row Level Security activada en todas las tablas: el público solo lee el catálogo, solo el admin escribe. Tabla nueva = RLS + reglas explícitas.
- La clave secreta (service role) nunca va en el repositorio ni en el navegador. `.env.local` va en `.gitignore`. Solo se usa la clave "publishable". Excepción acordada (16/10/2026, rama `cloudflare`): `.env.production` SÍ se commitea con la URL y la clave publishable (públicas por diseño), porque Cloudflare no le pasaba las variables cargadas en su panel al armado.
- Nunca manejar datos de tarjeta. Los pagos van por el checkout de Mercado Pago.
- Funciones públicas de la base: `security definer` con `search_path = ''`, validan y recortan lo que llega, calculan ellas los precios y el stock, y llevan freno de abusos (`too_many`).
- Nada de HTML crudo con datos (`dangerouslySetInnerHTML`, `innerHTML`). Links externos con `rel="noopener"`.
- Cualquier recurso de afuera (YouTube, Mercado Pago, mapas) hay que sumarlo a la Content-Security-Policy de `next.config.ts`; si no, el navegador lo bloquea.
- Dependencias: las mínimas, y `npm audit` al sumar una.

Revisión completa del 11/10/2026:
- Estaba bien: RLS en todas las tablas, registro de usuarios apagado, sin secretos en el repo ni en el historial, sin HTML crudo, `npm audit` sin vulnerabilidades, fotos optimizadas solo desde el servidor de Supabase, panel sin indexar.
- Se agregó en el código (en `dev`): cabeceras de seguridad en `next.config.ts` (Content-Security-Policy, HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; sin `X-Powered-By`). Probadas en la tienda sin bloqueos; el panel con login lo tiene que probar Nicolás.
- Se escribió `supabase/migrations/0008_refuerzos_de_seguridad.sql`, ejecutada y verificada como visitante: freno de abusos por IP (`rate_limits` + `too_many`) en `track`, `save_cart` y `create_order`; tope de tamaño del carrito guardado; las fotos de productos ocultos y diseños apartados dejan de ser consultables; el bucket solo acepta imágenes de hasta 8 MB.
- Queda en manos de Nicolás: verificación en dos pasos en GitHub, Supabase, Netlify y el registrador de dominio que use, y contraseña larga y única para el panel. Es el riesgo más grande que queda.
- Límites conocidos: la CSP usa `'unsafe-inline'` (Next lo necesita sin nonces); el freno de abusos no se pudo probar sin crear pedidos reales.

## Marca y diseño
- Logo: arco con un mate y bombilla adentro. El emblema (`public/logo-mark.png`) se usa como máscara CSS y toma el color del texto.
- Tema oscuro (principal): fondo #220f09, superficie #2d1810, texto #f6efe9, texto apagado #c0afa3, acento verde yerba #aac56b.
- Tema claro: fondo #ece5de, texto #220f09, acento #4d6820.
- Fuentes: Outfit (títulos) y Figtree (texto).
- Estilo: moderno, líneas finas, precios grandes y claros, descuentos con badge. Referencia que le gusta a Nicolás: nebenstudio.com.ar (animaciones, portada con video).
- Etiquetita arriba de los títulos ("eyebrow"): Nicolás pidió dejarla en una o dos secciones como mucho. Quedó solo en la portada y en "Armá tu equipo".
- Preferencias ya dichas: brillo y zoom originales en las tarjetas al pasar el mouse; sin destello verde en las secciones destacadas; reseñas con fuente normal, sin huecos, tipo comentario; botones de WhatsApp e Instagram con los colores de cada app.
- `referencia/unmate.html`: el diseño original, solo para consultar. La web ya se alejó bastante de él.

## Pendiente de Nicolás
Preguntarle cada tanto; listarlo cuando pregunte qué quedó pendiente.
- Portada: ya mandó un video (el del mate cebándose) y dijo que más adelante manda otro para que se alternen. Si quiere más calidad, que pase el archivo original del celular (cable, Drive o mail), filmado más de lejos.
- Texto y foto suya para la sección "Quién soy" (dijo que los manda). Foto vertical, si puede.
- Foto de fondo del final de la página: una buena imagen horizontal; va en `public/final.jpg`.
- Seguridad: activar la verificación en dos pasos en GitHub, Supabase y Netlify, y probar el panel con login en https://unmatees.netlify.app/admin (primera publicación con las cabeceras de seguridad).
- Sacar `unmatees.lat` de Netlify (Domain management) y, si quiere, comprar un dominio nuevo.
- Elegir el descuento por armar equipo en el panel (pestaña Productos); hoy está en 0 %.
- Textos y fotos de los tipos de mate (`MateTypes.tsx` tiene dibujos y textos provisorios).
- Descripciones nuevas de los productos.
- Videos de curado (links de YouTube) para `CureGuide`. A futuro: mandar el video de curado después de la compra.
- En el panel: fotos y reseñas reales, porcentajes de cada yerba, borrar los datos de prueba, probar el circuito de pedidos.
- Sin definir todavía: condiciones de envío, medios de pago y cuotas; si hace personalizados, regalos o venta por mayor.
- Más adelante: Mercado Pago, envíos y facturación, dominio propio.
- Dato: en Tiendanube el termo figura con el nombre de una marca; en la web se llama "Termo 1,2 L".
