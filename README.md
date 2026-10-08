# unmate.es

Tienda online de mates, bombillas y termos. El cliente arma el carrito y manda el pedido por WhatsApp.

Hecha con [Next.js](https://nextjs.org/docs) (la web) y, próximamente, [Supabase](https://supabase.com/docs) (base de datos, login y archivos).

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
  app/
    layout.tsx       Marco de todas las páginas: fuentes, título, descripción
    page.tsx         La página de inicio: arma las secciones en orden
    globals.css      Todos los estilos. Los colores están arriba de todo, en variables
  components/
    site/            Secciones de texto fijo: Header, Hero, Guide, Contact, Footer
    shop/            Lo interactivo: catálogo, ficha, carrito, "Armá tu equipo"
  lib/
    catalog.ts       De dónde sale el catálogo (hoy: src/data; después: Supabase)
    cart-store.ts    El carrito, guardado en el navegador del cliente
    site.ts          Número de WhatsApp, Instagram y el texto del pedido
    format.ts        Formato de precios y descuentos
    types.ts         Qué campos tiene un producto y una categoría
  data/catalog.ts    Los productos (provisorio, hasta conectar la base)
public/logo.webp     El logo
public/productos/    Una carpeta de fotos por producto
supabase/            SQL para crear la base: tablas, seguridad y carga inicial
referencia/          El diseño original en un solo HTML (solo para consultar)
```

## Cambios frecuentes

- **Fotos de un producto:** copiá las imágenes (JPG, PNG o WebP) a `public/productos/<producto>/`. Se muestran todas, en orden de nombre: llamalas `1.jpg`, `2.jpg`, `3.jpg`... y la `1` es la principal. Con más de una, la foto se desliza. Sin fotos, se ve la ilustración.
- **Precio, nombre o producto nuevo:** `src/data/catalog.ts` (hasta que exista el panel de administración).
- **Número de WhatsApp o Instagram:** `src/lib/site.ts`.
- **Textos de la portada o de la guía:** `src/components/site/`.
- **Colores:** el primer bloque de `src/app/globals.css`.

## Estado del proyecto

Etapa 1 (base):

- [x] Proyecto creado y diseño migrado desde `referencia/unmate.html`
- [x] SQL de tablas, seguridad y carga inicial escrito (`supabase/`), todavía sin ejecutar
- [x] Repositorio subido a GitHub
- [ ] Proyecto de Supabase creado y catálogo leyendo de la base
- [ ] Panel de administración con login
- [ ] Fotos y videos en Storage

Después: 2) pedidos registrados con estados, 3) pagos con Mercado Pago, 4) envíos y facturación.

## Seguridad

- Las claves van en `.env.local`, que **nunca** se sube al repositorio (ya está en `.gitignore`).
- La clave secreta de Supabase (service role) no se usa en el navegador ni se comparte por chat.
