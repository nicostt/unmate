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
    admin/page.tsx   La página del panel de administración
    globals.css      Todos los estilos. Los colores están arriba de todo, en variables
  components/
    site/            Secciones de texto fijo: Header, Hero, Guide, Contact, Footer
    admin/           El panel: login, lista, formulario y fotos
    shop/            Lo interactivo: catálogo, ficha, carrito, "Armá tu equipo"
  lib/
    catalog.ts       Lee el catálogo de Supabase (y las fotos de public/productos)
    supabase.ts      La conexión a Supabase
    cart-store.ts    El carrito, guardado en el navegador del cliente
    site.ts          Número de WhatsApp, Instagram y el texto del pedido
    format.ts        Formato de precios y descuentos
    types.ts         Qué campos tiene un producto y una categoría
public/logo.webp     El logo
supabase/            SQL para crear la base: tablas, seguridad y carga inicial
referencia/          El diseño original en un solo HTML (solo para consultar)
```

## Cambios frecuentes

- **Productos, precios, stock y fotos:** desde el panel, en `/admin` (en tu compu: http://localhost:3000/admin). Entrás con el email y la contraseña del usuario que creaste en Supabase. Los cambios se ven en la tienda al instante.
- **Número de WhatsApp o Instagram:** `src/lib/site.ts`.
- **Textos de la portada o de la guía:** `src/components/site/`.
- **Colores:** el primer bloque de `src/app/globals.css`.

## Estado del proyecto

Etapa 1 (base):

- [x] Proyecto creado y diseño migrado desde `referencia/unmate.html`
- [x] Tablas, seguridad y carga inicial ejecutadas en Supabase (`supabase/`)
- [x] Repositorio subido a GitHub
- [x] Proyecto de Supabase creado y catálogo leyendo de la base
- [x] Panel de administración con login (falta probarlo con la cuenta real)
- [x] Fotos en Storage, subidas desde el panel
- [ ] Videos de curado

Después: 2) pedidos registrados con estados, 3) pagos con Mercado Pago, 4) envíos y facturación.

## Seguridad

- Las claves van en `.env.local`, que **nunca** se sube al repositorio (ya está en `.gitignore`).
- La clave secreta de Supabase (service role) no se usa en el navegador ni se comparte por chat.
