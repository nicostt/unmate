# unmate.es

Tienda online de mates, bombillas, yerba y termos. El cliente arma el carrito y manda el pedido por WhatsApp; el pedido queda registrado y se maneja desde un panel de administración.

Hecha con [Next.js](https://nextjs.org/docs) (la web) y [Supabase](https://supabase.com/docs) (base de datos, login y fotos). Publicada en Netlify: https://unmatees.lat

## Cómo correrla en tu compu

Necesitás [Node.js](https://nodejs.org) 20 o más nuevo. La primera vez:

```bash
npm install
```

Después, cada vez que quieras trabajar:

```bash
npm run dev
```

y abrís http://localhost:3000. Los cambios que guardes se ven al instante.

| Comando | Para qué |
|---|---|
| `npm run dev` | Levanta la web en modo desarrollo |
| `npm run lint` | Revisa el código buscando errores comunes |
| `npm run build` | Compila la versión que se publica. Si esto falla, no se publica |
| `npm start` | Corre la versión compilada |

## Dónde está cada cosa

```
src/
  app/                 Las páginas
    layout.tsx           Marco de todas: fuentes, título, descripción
    page.tsx             La tienda. Acá se decide el ORDEN de las secciones
    admin/page.tsx       El panel de administración
  components/
    site/                Secciones de contenido: encabezado, portada, guías,
                         reseñas, contacto, pie
    shop/                Lo que vende: catálogo, tarjeta, ficha, galería,
                         carrito, "Armá tu equipo"
    admin/               El panel: login, productos, yerba, pedidos, reseñas,
                         estadísticas
  lib/                 Lógica sin pantalla
    types.ts             Qué es un producto y TODAS las cuentas de precio y stock
    catalog.ts           Lee el catálogo de la base
    orders.ts            Registra un pedido
    site.ts              Número de WhatsApp, Instagram y texto del pedido
    hero.ts              Qué videos o fotos van en la portada y al final
    search.ts            Buscador: sin tildes, con resaltado y "parecidos"
    motion.ts, fly.ts    Animaciones hechas desde JavaScript
    track.ts             Estadísticas anónimas
    cart-store.ts        El carrito, guardado en el navegador del cliente
    supabase.ts          La conexión a la base
    format.ts, theme.ts  Formato de precios; tema claro u oscuro
  styles/              Los estilos, un archivo por zona (ver abajo)
public/
  hero/                Videos de la portada (1.mp4, 2.mp4...)
  final.jpg            Foto de fondo del final de la página (todavía no está)
  quien-soy.jpg        Foto de la sección "Quién soy" (todavía no está)
  logo-mark.png        El emblema del logo
supabase/migrations/   Los cambios de la base, numerados en el orden en que se ejecutaron
referencia/            El diseño original en un solo HTML (solo para consultar)
```

### Estilos

`src/styles/index.css` los junta en orden. Para cambiar algo, abrí el archivo de esa zona:

| Archivo | Qué tiene |
|---|---|
| `base.css` | Colores (arriba de todo, en variables), fuentes y utilidades |
| `header.css` | Encabezado y pie |
| `controls.css` | Botones, filtros, campos y selector de cantidad |
| `overlays.css` | Ventanas, fondo oscurecido y avisos |
| `hero.css` | Portada y "cómo comprar" |
| `catalog.css` | Catálogo, tarjetas, galería y ficha de producto |
| `cart.css` | Carrito |
| `sections.css` | Tipos de mate, equipo, curado, reseñas y contacto |
| `motion.css` | Qué cambia para quien pidió "menos movimiento" en su dispositivo |
| `admin.css` | Todo el panel. Solo se carga en `/admin` |
| `not-found.css` | La página de error 404. Solo se carga ahí |

El orden importa: si dos reglas pisan lo mismo, gana la que está más abajo.

## Cambios frecuentes

- **Productos, yerba, categorías, precios, stock, fotos, pedidos y reseñas:** desde el panel, en `/admin`. Entrás con el email y la contraseña del usuario de Supabase. Los cambios se ven en la tienda al instante.
- **Videos de la portada:** copiarlos a `public/hero/` como `.mp4` o `.webm`. Aparecen solos, en orden de nombre.
- **Foto del final de la página:** guardarla como `public/final.jpg` (o `.webp` / `.png`). Mientras no esté, va la foto de un producto.
- Después de agregar o quitar esos archivos hay que reiniciar `npm run dev`: la lista se arma al arrancar (`next.config.ts`).
- **"Quién soy":** el texto está en `src/components/site/About.tsx`; la foto se guarda como `public/quien-soy.jpg`. Mientras `ready` esté en `false` la sección no aparece en la web publicada.
- **Descuento por armar equipo:** en el panel, pestaña Productos, abajo de la lista.
- **Palabras que rotan en el título de la portada:** la lista `FOR` en `src/components/site/Hero.tsx`.
- **Número de WhatsApp o Instagram:** `src/lib/site.ts`.
- **Textos de la portada o de las guías:** `src/components/site/`.
- **Orden de las secciones:** `src/app/page.tsx`.
- **Colores:** el primer bloque de `src/styles/base.css`.

## Cambios en la base de datos

Cada cambio de estructura es un archivo nuevo en `supabase/migrations/`, con el número siguiente. Se ejecuta una sola vez, entero, en el SQL Editor de Supabase. Los archivos ya ejecutados no se modifican.

El descuento por armar equipo necesita la migración 0007: hasta ejecutarla, la tienda funciona igual pero sin descuento.

La tabla `product_variants` (migración 0002) y la fila `yerba_tiers` de `settings` (0004) quedaron sin uso: la tienda no las lee.

## Publicar

Se trabaja en la rama `dev`. Netlify publica lo que llega a `main`, y cada publicación gasta créditos del plan gratis, así que conviene juntar cambios y publicar de a tandas.

`netlify.toml` declara el plugin `@netlify/plugin-nextjs`. Sin eso el sitio se publica pero todo da "Page not found".

## Etapas

- [x] 1. Base: catálogo en la base, panel con login, fotos
- [x] 2. Pedidos por WhatsApp registrados, con estados y control de stock
- [ ] 3. Pagos con Mercado Pago
- [ ] 4. Envíos y facturación

## Seguridad

- Las claves van en `.env.local`, que **nunca** se sube al repositorio (ya está en `.gitignore`). El modelo está en `.env.example`.
- La clave secreta de Supabase (service role) no se usa en el navegador ni se comparte por chat.
- El panel no tiene nada secreto en sí: lo que protege los datos son las reglas de la base (Row Level Security). El público solo lee el catálogo; solo el administrador escribe.
- Los precios y el stock de un pedido los calcula la base, no el navegador.
