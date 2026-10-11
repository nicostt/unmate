# unmate.es — tienda de mates

## Qué es
Tienda online de mates, bombillas, yerba y termos. El cliente arma un carrito y el pedido se manda por WhatsApp, quedando registrado en la base. El dueño del proyecto es Nicolás y es su primer proyecto web real. Idioma de trabajo: español rioplatense informal.

## Cómo trabajar con Nicolás
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
- Ramas: se trabaja y se sube a `dev`. `main` es lo que publica Netlify y SOLO se actualiza cuando Nicolás dice "publicá".
- Netlify Free (permite uso comercial; Vercel Hobby lo prohíbe): 300 créditos por mes, 15 por publicación; si se agotan el sitio se pausa. Por eso se publica de a tandas.
- `netlify.toml` declara `@netlify/plugin-nextjs`. Sin eso el adaptador no se activa y todo da 404.
- Dominio: `unmatees.lat` (Namecheap, con Netlify DNS). Quería el `.com` y compró `.lat` por error; decidió usarlo. `unmate.es` lo tiene registrado un conocido suyo.
- Para verificar una publicación, mirar directamente https://unmatees.lat (la dirección `shiny-hamster-7b8446.netlify.app` ya no responde y la consulta pública de deploys devuelve 401).
- Publicado: `main` = commit `2471ba1` (9/10/2026), 7.ª publicación del mes (105 créditos como mínimo).
- EN `dev` SIN PUBLICAR (Nicolás pidió esperar a terminar los cambios de diseño y el material pendiente): botones de estadísticas (contarme, actualizar, borrar), catálogo arriba de los tipos de mate, fotos de reseñas a 150 px, portada con video, encabezado compacto en celulares, estilos repartidos por zona, y la tanda de ideas del 11/10/2026 (ver abajo).
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
- **Portada:** videos de `public/hero/*.mp4|webm` en orden de nombre; si no hay, las fotos de los dos primeros productos. Se funden cada 7 s. Aprobada por Nicolás el 10/10/2026. Hoy hay un solo video de prueba (`1.mp4`: 4 segundos, 832 × 464, llegó comprimido por WhatsApp). En esta compu no hay ffmpeg. OJO: la lista de archivos la arma `next.config.ts` AL COMPILAR (variables `HERO_VIDEOS` y `END_IMAGE`), porque en Netlify la carpeta `public/` no está a mano mientras la web corre; tras agregar un archivo hay que reiniciar el servidor de desarrollo. El título es "Un mate para" + una palabra que rota (`RotatingWord.tsx`, lista `FOR` en `Hero.tsx`).
- **Final de la página:** `Footer.tsx` ocupa toda la pantalla con una foto de fondo (`public/final.jpg|webp|png`; mientras no exista, la foto de un producto), los links y el nombre gigante cuyas letras saltan y sueltan yerba, con un contador de "mates cebados" (`FooterName.tsx`).
- **Descuento por armar equipo:** el equipo son 4 partes (`KIT_PARTS` en `src/lib/types.ts`: categorías `mates`, `bombillas`, `termos` y `yerba` en paquete; la yerba suelta no cuenta). Si el carrito trae productos de `min` partes o más, se descuenta `percent` % sobre UN producto de cada parte (el más caro), redondeado a $ 10 (`kitSaving`). Vale también si se suman sueltos al carrito, no solo desde "Armá tu equipo". El ajuste vive en la fila `kit_discount` de `settings` y se cambia en el panel (pestaña Productos, `KitDiscountForm.tsx`); la base hace la misma cuenta en `create_order` y guarda `orders.discount`. Fue decisión de Claude (Nicolás solo pidió "un descuento al armar un paquete de 3, configurable, y a partir de cuántos"): confirmar con él que la regla le sirve.
- **Buscador** (`src/lib/search.ts`): sin tildes ni mayúsculas, todas las palabras en cualquier orden, resalta lo que coincide con `<mark>`. Si nada coincide muestra "parecidos" (tolera errores de tipeo). El cartel "¿No encontrás lo que buscabas?" aparece solo si no hay ni parecidos y la persona dejó de escribir (900 ms).
- **Animaciones** (tanda del 11/10/2026, tomadas del "Muestrario de interfaces" que pasó Nicolás): encabezado que se esconde al bajar (`HideOnScroll.tsx`), producto que vuela al carrito (`src/lib/fly.ts`), foto que viaja de la tarjeta a la ficha y cambio de tema en círculo (View Transitions, `src/lib/motion.ts`), filtro con FLIP (`useFlip.ts`), carrito como hoja arrastrable en celular (`CartDrawer.tsx`), título de la pestaña que llama al irse con carrito cargado, grano de película (clase `.grain`), página 404 con ojos (`src/app/not-found.tsx`). Quien pidió "menos movimiento" ve fundidos (`src/styles/motion.css` y `reducedMotion()`).
- **Salidas animadas** (pedido de Nicolás, 11/10/2026: lo que entra con animación también tiene que irse con una): el carrito y la ventana del equipo siguen en pantalla un instante con la clase `is-closing` (`usePresence.ts`; en `KitBuilder.tsx` a mano) y recién después se sacan; la ficha de producto se va con la View Transition; y en las listas (`useFlip.ts`: catálogo, renglones del carrito, reseñas) lo que desaparece se achica y se desvanece. Para esto último `useFlip` vuelve a poner un instante en la página el elemento que React ya sacó, fijo en su lugar. Regla para lo que se agregue: si algo aparece animado, tiene que tener su salida.
- **Panel:** borrar pide MANTENER APRETADO un segundo (`HoldButton.tsx`) en vez de un "¿Estás seguro?"; marcar un pedido como entregado sigue preguntando con una ventana porque tiene advertencias. Los productos se ordenan arrastrando de una manija (`SortableList.tsx`), o con las flechas del teclado.
- **En el navegador de prueba de Claude** (panel oculto) las transiciones, los requestAnimationFrame y los eventos de scroll no avanzan solos: las animaciones se verifican por estado del DOM, y a Nicolás hay que pedirle que las mire.
- **Efecto de aparecer al bajar:** atributo `data-reveal` + `Reveal.tsx`, que revisa posiciones al hacer scroll (no usa IntersectionObserver). El catálogo no lo lleva, a pedido.
- **Orden de la página** (`src/app/page.tsx`): portada, catálogo, tipos de mate, equipo, curado, reseñas, contacto.
- **Solo local:** `src/app/stats-preview/page.tsx` muestra las estadísticas con datos inventados. Está excluida en `.git/info/exclude`; NO commitear ni publicar.

## Base de datos
- Migraciones en `supabase/migrations/`, de 0001 a 0007, TODAS ejecutadas por Nicolás y verificadas (la 0007, del descuento por equipo, el 11/10/2026: existe la fila `kit_discount` y la columna `orders.discount`). No queda SQL pendiente. El descuento arranca apagado (0 %): lo prende Nicolás desde el panel. Claude no puede ejecutar SQL: cada cambio de esquema es un archivo nuevo que corre Nicolás en el SQL Editor.
- Sin uso: tabla `product_variants` (0002; Nicolás descartó las "presentaciones" por engorrosas) y la fila `yerba_tiers` de `settings` (0004).
- Datos de prueba que dejó Claude y Nicolás tiene que borrar: Pedido #14 "PRUEBA estadisticas Claude (borrar)", quizá "PRUEBA de Claude (borrar)", y en estadísticas el visitante `prueba-claude-0001`, orígenes `prueba`/`prueba-claude` y la búsqueda "prueba claude".

## Seguridad
- Row Level Security activada en todas las tablas: el público solo lee el catálogo, solo el admin escribe.
- La clave secreta (service role) nunca va en el repositorio ni en el navegador. `.env.local` va en `.gitignore`.
- Nunca manejar datos de tarjeta. Los pagos van por el checkout de Mercado Pago.

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
- Videos de la portada definitivos: alguien tomando mate y un mate cebándose. 8 a 15 segundos, horizontales, archivo original (no reenviado por WhatsApp).
- Foto de fondo del final de la página: una buena imagen horizontal; va en `public/final.jpg`.
- Elegir el descuento por armar equipo en el panel (pestaña Productos); hoy está en 0 %.
- Textos y fotos de los tipos de mate (`MateTypes.tsx` tiene dibujos y textos provisorios).
- Descripciones nuevas de los productos.
- Videos de curado (links de YouTube) para `CureGuide`. A futuro: mandar el video de curado después de la compra.
- En el panel: fotos y reseñas reales, porcentajes de cada yerba, borrar los datos de prueba, probar el circuito de pedidos.
- Sin definir todavía: condiciones de envío, medios de pago y cuotas; si hace personalizados, regalos o venta por mayor.
- Más adelante: Mercado Pago, envíos y facturación, renovación del dominio.
- Dato: en Tiendanube el termo figura con el nombre de una marca; en la web se llama "Termo 1,2 L".
