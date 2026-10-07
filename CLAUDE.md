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
- 7/10/2026: proyecto Next.js 16 creado (App Router, TypeScript, CSS plano, sin Tailwind). Diseño migrado y verificado. El catálogo se lee de `src/data/catalog.ts` a través de `getCatalog()` en `src/lib/catalog.ts`.
- Fotos: `getCatalog()` lista las imágenes de `public/productos/<slug>/` (provisorio hasta Storage); `Gallery.tsx` las muestra deslizables en tarjeta y ficha. Botón de modo claro/oscuro en el header (`ThemeToggle.tsx`, `src/lib/theme.ts`).
- `supabase/migrations/0001_catalogo.sql` y `supabase/seed.sql` están escritos pero nunca se ejecutaron: revisarlos contra el proyecto real al conectarlo.
- Falta de la etapa 1: primer commit y GitHub, proyecto Supabase, catálogo desde la base, panel admin con login, Storage.
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
