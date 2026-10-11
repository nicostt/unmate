# Plantilla: tienda con carrito y pedido por WhatsApp

Este archivo resume la esencia de la tienda de unmate para poder armar otra
igual con otra marca y otro rubro (ropa, cosmética, plantas, lo que sea).

Tiene dos usos:

1. **Como prompt:** completás la ficha de la sección 1, y le pasás el archivo
   entero a una IA que programe (Claude Code, por ejemplo) con la frase
   *"Construí esta tienda siguiendo este documento, etapa por etapa"*.
2. **Como guía para adaptar este mismo repositorio:** copiás el proyecto,
   y usás la sección 9 como lista de qué cambiar.

Lo segundo es más rápido y más confiable: el código ya está probado. Lo
primero sirve cuando el rubro es muy distinto o se quiere arrancar limpio.

---

## 1. Ficha de la marca (completar)

| Dato | Valor |
|---|---|
| Nombre de la marca | `...` |
| Rubro y qué vende | `...` |
| Categorías iniciales | `...` |
| WhatsApp de ventas (con código de país) | `...` |
| Instagram | `...` |
| Idioma y tono de los textos | `...` (ej.: español rioplatense informal) |
| Moneda | `...` (ej.: ARS, sin decimales) |
| Color de fondo, texto y acento (tema oscuro) | `...` |
| Color de fondo, texto y acento (tema claro) | `...` |
| Fuente de títulos y fuente de texto | `...` |
| Logo (archivo) | `...` |
| Frase de portada (dos renglones) | `...` |
| Cómo se vende cada cosa (ver sección 4) | `...` |
| Secciones de contenido propias del rubro (ver sección 6) | `...` |
| Dominio | `...` |

---

## 2. Qué es

Una tienda online de una sola página más un panel de administración.

- El cliente **no se registra ni paga en la web**. Mira el catálogo, arma un
  carrito y toca "Pedir por WhatsApp": se abre el chat del vendedor con el
  pedido ya escrito (productos, cantidades, total y número de pedido).
- El pedido queda **registrado en la base de datos** antes de abrir WhatsApp.
- El dueño maneja todo desde `/admin`: productos, precios, stock, fotos,
  pedidos, reseñas y estadísticas. No toca código.
- El pago y el envío se coordinan por chat. Más adelante se puede sumar un
  checkout (Mercado Pago u otro) sin rehacer nada.

Está pensada para un emprendimiento chico: costo cero o casi cero, y un solo
administrador.

---

## 3. Tecnología

- **Next.js** (App Router, TypeScript). CSS plano repartido por zona en `src/styles/`
  con variables de color; sin Tailwind ni librerías de componentes.
- **Supabase**: Postgres (datos), Auth (login del administrador) y Storage
  (fotos de productos).
- **Hosting:** Netlify Free, que permite uso comercial. Necesita un
  `netlify.toml` que declare el plugin `@netlify/plugin-nextjs`; sin eso el
  sitio publica "en verde" pero todo da 404. Vercel Hobby prohíbe uso
  comercial.
- **Ramas:** se trabaja en `dev`; `main` es lo que se publica. Cada
  publicación gasta créditos, así que se publica de a tandas.

Reglas de arquitectura:

- La tienda pública se renderiza en el servidor y lee el catálogo con una
  sola función cacheada (`getCatalog()`), que se invalida cuando el panel
  guarda un cambio.
- El panel corre entero en el navegador con la sesión de Supabase. **La
  seguridad no está en el panel sino en la base** (ver sección 7).
- Todo lo que mueve plata o stock (crear un pedido, cambiar su estado) es
  una **función de la base de datos**, no código del navegador: el precio y
  el stock se calculan y validan ahí, nunca se confía en lo que manda el
  cliente.

---

## 4. Modos de venta

Cada producto se vende de una de estas formas. Elegir las que necesite el
rubro; no hace falta implementar todas.

| Modo | Cómo funciona | Ejemplo |
|---|---|---|
| **Por unidad** | Precio fijo, stock en unidades. | Una bombilla, un perfume |
| **Por peso o medida** | El precio es por kilo (o metro, litro); el stock está en gramos; se compra en pasos fijos (250 g). Puede tener recargo por poca cantidad y descuento por mucha, en porcentaje, propio de cada producto. | Yerba suelta, tela, café |
| **Piezas únicas** | Cada unidad es distinta y tiene sus propias fotos. El cliente elige cuál quiere; mismo precio para todas. Al venderse, esa pieza desaparece. | Mates artesanales, cerámica, ropa vintage |
| **Con variantes** | Un producto con combinaciones (talle y color), cada una con su stock y opcionalmente sus fotos. El cliente elige la combinación antes de agregar. | Ropa, calzado |

**Ojo:** unmate tiene los tres primeros. "Con variantes" **no está
construido** y es el que necesita una tienda de ropa. Se arma con la misma
idea que las piezas únicas (una tabla hija del producto, con stock propio, y
una clave de carrito `producto#variante`), cambiando la elección por fotos
por selectores de talle y color, y una guía de talles.

Avisos de stock en la tienda: "Últimas 3", "Últimas 2", "Última unidad",
"Agotado". Con más de 3 no se muestra nada. No se puede agregar al carrito
más de lo que hay.

---

## 5. Circuito de un pedido

1. El cliente toca "Pedir por WhatsApp" y opcionalmente deja nombre y nota.
2. La base valida el stock y registra el pedido con número correlativo. Si
   algo se quedó sin stock, el pedido no se crea y la tienda avisa cuál fue.
3. Se abre WhatsApp con el mensaje armado y el número de pedido.
4. En el panel, el pedido pasa por estados:

| Estado | Qué pasa con el stock |
|---|---|
| Pendiente | Nada. Todo sigue a la venta. |
| Confirmado | Se descuenta. Las piezas únicas quedan apartadas. |
| Entregado | Definitivo: no se puede deshacer. Las piezas únicas se eliminan y el pedido pasa a "Vendidos". |
| Cancelado | Si estaba confirmado, el stock vuelve. Se puede reabrir. |

Cada pedido se titula con el nombre del cliente ("Pedido de Juan") y se
puede renombrar.

---

## 6. Secciones de la tienda

En orden, de arriba hacia abajo:

1. **Encabezado fijo:** logo, navegación, botón de tema claro u oscuro y
   carrito con contador. En celular, compacto en un solo renglón.
2. **Portada a pantalla casi completa:** video o fotos de fondo que se
   funden entre sí, velo oscuro, título centrado en dos colores, y dos
   botones (ver catálogo, consultar por WhatsApp).
3. **Cómo comprar:** tres pasos, desplegable.
4. **Catálogo:** filtros por categoría, buscador, tarjetas con foto, precio
   grande, precio anterior tachado y badge de descuento. Al pasar el mouse
   la tarjeta pasa sus fotos sola; el clic abre una ventana con galería
   deslizable y descripción. Si la búsqueda no encuentra nada, un cartel
   ofrece preguntar por WhatsApp con lo buscado ya escrito.
5. **Guía para elegir** (propia del rubro): en unmate, tipos de mate. En
   ropa sería guía de talles o de cuidado de las prendas.
6. **Armá tu combo:** tres casilleros (en unmate: mate, bombilla, termo)
   que abren una ventana con fotos para elegir y suman todo al carrito. En
   ropa: "armá tu conjunto".
7. **Guía de uso o cuidado** (propia del rubro): en unmate, curado del mate.
8. **Reseñas:** las carga el dueño desde el panel, con nombre, foto del
   cliente, texto y fotos. Solo reseñas reales. Se destacan hasta 5 y un
   botón muestra el resto. Sin reseñas, la sección no aparece.
9. **Contacto y pie:** botones de WhatsApp e Instagram con los colores de
   cada aplicación.

Carrito: panel lateral con cantidades, total y botón de pedido. Se guarda
en el navegador y se ajusta solo si el stock bajó.

Estilo: moderno, líneas finas, precios grandes y claros, mucho aire. Las
secciones aparecen suavemente al bajar, salvo el catálogo. Tema oscuro y
claro con variables CSS.

---

## 7. Datos y seguridad

Tablas principales:

- `categories`, `products` (nombre, slug, precio, precio anterior, stock,
  visible o no, orden, modo de venta), `product_media` (fotos y videos).
- Tabla hija según el modo: `product_designs` (piezas únicas) o
  `product_variants` (talle y color).
- `orders` y `order_items`: cada renglón guarda una **copia** del nombre,
  precio y foto, para que el historial no cambie si el producto se edita o
  se borra.
- `reviews`.
- `events` y `carts` para estadísticas.
- `admins`: quién es administrador.

Seguridad, sin excepciones:

- **Row Level Security activada en todas las tablas.** El público solo lee
  el catálogo visible. Solo el administrador escribe.
- Registro de usuarios apagado: el único usuario lo crea el dueño a mano.
- El público crea pedidos solo a través de la función `create_order`, que
  recalcula precios y valida stock.
- La clave secreta de la base nunca va al repositorio ni al navegador.
- Nunca se manejan datos de tarjeta. Si se suman pagos, van por el checkout
  del proveedor.
- Todas las cuentas (GitHub, base, hosting, dominio) a nombre del dueño.

---

## 8. Panel de administración

Pestañas:

- **Productos:** alta, edición, borrado, mostrar u ocultar, ordenar con
  flechas, categorías editables. Fotos: elegir, arrastrar o pegar con
  Ctrl+V. Las fotos se achican antes de subirse.
- **Pedidos** y **Vendidos:** el circuito de la sección 5.
- **Reseñas.**
- **Estadísticas**, anónimas y sin cookies de terceros. Cuentan personas
  distintas, no clics:
  - embudo: visitaron, abrieron un producto, agregaron al carrito, pidieron;
  - productos con mucho interés y pocas ventas;
  - carritos sin terminar;
  - agotados que siguen recibiendo visitas;
  - búsquedas sin resultado;
  - origen, dispositivo y horarios.

  No cuenta al administrador ni a `localhost`, salvo que él active "contar
  también lo que hago yo". Cada gráfico tiene su explicación detrás de un
  "?". Hay un botón para borrar las estadísticas.

---

## 9. Para adaptar este repositorio a otra marca

1. Copiar el proyecto a un repositorio nuevo y crear un proyecto nuevo de
   Supabase. Ejecutar en orden los archivos de `supabase/migrations/`.
2. Crear `.env.local` con la URL y la clave pública del proyecto nuevo
   (modelo en `.env.example`).
3. Cambiar:

| Qué | Dónde |
|---|---|
| Colores y fuentes | `src/styles/base.css` (variables de `:root`) y `src/app/layout.tsx` |
| Logo y favicon | `public/logo-mark.png`, `src/app/icon.png`, `src/app/apple-icon.png` |
| WhatsApp, Instagram y texto del pedido | `src/lib/site.ts` |
| Portada | `src/components/site/Hero.tsx`; videos en `public/hero/` |
| Navegación y pie | `src/components/site/Header.tsx`, `Footer.tsx` |
| Guías del rubro | `src/components/site/Guide.tsx`, `MateTypes.tsx` |
| Combo | `src/components/shop/KitBuilder.tsx` |
| Orden de las secciones | `src/app/page.tsx` |
| Modos de venta | `src/lib/types.ts` y el formulario del panel |

4. Cargar categorías y productos desde `/admin`.
5. Conectar el repositorio a Netlify y el dominio.

---

## 10. Orden de construcción (si se arranca de cero)

1. **Base:** repositorio, diseño, catálogo leído de la base, panel con
   login, fotos. Publicar.
2. **Pedidos** registrados con estados y control de stock.
3. **Estadísticas y reseñas.**
4. **Pagos** con checkout externo. Ahí revisar las obligaciones legales del
   país (botón de arrepentimiento, datos fiscales).
5. **Envíos y facturación**, consultando con un contador.

Forma de trabajo que funcionó: commit antes de cada cambio grande, ver la
web andando mientras se edita, acordar los cambios grandes antes de
programarlos, y que cada cambio de la base sea un archivo SQL numerado.
