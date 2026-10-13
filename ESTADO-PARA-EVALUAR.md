# unmate.es — estado del proyecto, para evaluar desde afuera

**Para quien lea esto (otro chat o una persona):** este documento describe,
sin adornos, cómo está hoy una tienda online hecha por una sola persona que
no es programadora, con ayuda de una IA. Se pide una opinión honesta sobre
**qué tan lista está para funcionar como tienda real** y qué falta. Al final
hay una lista de preguntas concretas.

No trae claves ni datos privados. Fecha: 13 de octubre de 2026.

---

## 1. Contexto

- **Qué es:** tienda de mates, bombillas, yerba y termos, de Argentina.
- **Quién la hace:** Nicolás. Es su primer proyecto web. No programa: decide
  qué quiere, prueba y corrige; el código lo escribe una IA (Claude Code), que
  le explica cada pieza.
- **Tiempo de trabajo:** unos 6 días, desde cero.
- **Escala:** emprendimiento chico. Hoy 13 productos y 7 reseñas reales.
- **Objetivo declarado:** una web profesional, escalable y que pueda
  mantener sin depender de una IA.
- **Tiene una tienda en Tiendanube** que sigue activa como respaldo.

## 2. Cómo se vende

El cliente **no se registra ni paga en la web**. Mira el catálogo, arma un
carrito y toca "Mandar pedido por WhatsApp": el pedido queda registrado en la
base con número, y se abre el chat del vendedor con todo escrito. Pago y
envío se coordinan a mano por ese chat.

Hay tres modos de venta:
- **por unidad** (bombillas, paquetes de yerba);
- **por peso** (yerba suelta, de a 250 g, con recargo o descuento según cantidad);
- **piezas únicas** (cada mate artesanal es distinto, con sus fotos; al venderse desaparece).

## 3. Tecnología

| Parte | Elección |
|---|---|
| Web | Next.js 16 (App Router, TypeScript), CSS plano sin librerías |
| Datos, login, fotos | Supabase (Postgres, Auth, Storage) |
| Hosting | Netlify, plan gratis |
| Código | GitHub, ramas `dev` (trabajo) y `main` (publicado) |
| Dependencias | 4 en total: next, react, react-dom, supabase-js |

Tamaño: unos 80 archivos de código propio, 8 migraciones de base de datos.

## 4. Qué está hecho

**Tienda**
- Catálogo con filtros, orden y buscador (sin tildes, tolera errores de tipeo).
- Ficha de producto con galería; aviso de poco stock; precios con descuento.
- Carrito guardado en el navegador, que se ajusta si el stock bajó.
- "Armá tu equipo" (mate + bombilla + termo + yerba) con descuento configurable.
- Secciones de contenido: tipos de mate, cómo curarlo, reseñas, contacto.
- Tema claro y oscuro. Diseño adaptado a celular.
- Animaciones cuidadas, con versión reducida para quien pide menos movimiento.
- Página de error 404 propia.

**Panel de administración** (un solo usuario, con login)
- Productos: alta, edición, borrado, ocultar, ordenar arrastrando, fotos.
- Stock y precios editables desde la lista.
- Pedidos con estados (pendiente, confirmado, entregado, cancelado) que
  descuentan y devuelven stock; historial de vendidos.
- Reseñas, categorías, descuento por equipo.
- Estadísticas anónimas propias: embudo de visita a pedido, productos con
  interés y pocas ventas, carritos abandonados, búsquedas sin resultado.

**Seguridad** (hubo una revisión completa)
- Reglas de acceso en todas las tablas: el público solo lee el catálogo.
- Registro de usuarios apagado.
- Precios y stock los calcula la base, no el navegador.
- Sin claves secretas en el código ni en el historial.
- Cabeceras de seguridad (Content-Security-Policy, HSTS y otras).
- Freno de abusos por conexión en las funciones públicas.
- Sin vulnerabilidades conocidas en dependencias.

**Orden del proyecto**
- README con mapa de carpetas y cómo hacer cada cambio frecuente.
- Código comentado en español, explicando el porqué.
- Cada cambio de base de datos es un archivo numerado.

## 5. Qué NO está hecho

- **Pago online.** No hay. Está planeado Mercado Pago como etapa siguiente.
- **Envíos.** No se calculan ni se cotizan; se arreglan por chat.
- **Facturación.** Nada. Pendiente de consultar con un contador.
- **Legales.** No hay términos, política de privacidad, botón de
  arrepentimiento ni datos fiscales visibles. Fue una decisión consciente
  mientras no se cobre en la web, a revisar al sumar pagos.
- **Cuentas de clientes, historial de compras, mails automáticos.** No hay.
- **Pruebas automáticas.** Ninguna. Todo se verifica a mano.
- **Monitoreo.** No hay avisos si la web se cae o si algo falla.
- **Copias de seguridad propias.** Solo las que haga el plan gratis del proveedor.
- **SEO.** Solo título y descripción. Sin mapa del sitio, sin datos
  estructurados de producto, sin página propia por producto (todo es una
  sola página con ventanas).
- **Analítica de terceros.** No hay; solo las estadísticas propias.

## 6. Problemas y debilidades conocidas

Dichos tal cual, sin suavizar:

1. **La web publicada está caída hoy.** El registrador canceló y reembolsó el
   dominio porque no se respondió un mail de verificación. Hay que comprar
   un dominio de nuevo. El hosting no falló.
2. **La versión publicada está muy atrasada.** Casi todo lo de la sección 4 de
   seguridad, las animaciones y el descuento por equipo están en la rama de
   trabajo, sin publicar.
3. **Dependencia de la IA.** El dueño no sabe programar. Entiende qué hace
   cada parte porque se le explicó, pero no podría arreglar solo un error.
4. **Una sola persona, sin revisión de otro humano.** Nadie más leyó el código.
5. **Partes del panel sin probar por quien las escribió.** La IA no puede
   iniciar sesión, así que lo que requiere login lo prueba el dueño a mano.
6. **Las cuentas (código, base, hosting) todavía sin verificación en dos pasos.**
7. **Planes gratuitos en todo.** Hosting con cupo mensual de publicaciones;
   base de datos que el proveedor puede pausar por inactividad.
8. **Versión muy nueva del framework.** Poco material de ayuda y menos
   compatibilidad con otros hostings.
9. **Contenido incompleto.** Varios productos sin foto, descripciones
   provisorias, una sección con texto de relleno (oculta en la versión pública).
10. **El pedido depende de que el cliente efectivamente mande el WhatsApp.**
    Si no lo manda, queda un pedido registrado que nunca se concreta.

## 7. Preguntas para quien evalúe

1. Para una tienda de este tamaño, ¿este punto de partida es razonable,
   flojo o excesivo? ¿Qué cambiarías primero?
2. ¿Qué es **imprescindible** antes de cobrar online, y qué puede esperar?
3. De la lista "no está hecho", ¿qué orden de prioridad le darías?
4. ¿La elección de tecnología tiene algún riesgo serio que no se esté viendo?
5. ¿Tiene sentido seguir con desarrollo propio, o para este caso convenía una
   plataforma armada (Tiendanube, Shopify)? ¿En qué punto se justifica cada una?
6. ¿Qué revisarías de la seguridad que acá no figure?
7. Comparado con el otro proyecto que estás mirando: ¿en qué está mejor y en
   qué peor este?

Se agradece una respuesta directa, con lo malo primero.
