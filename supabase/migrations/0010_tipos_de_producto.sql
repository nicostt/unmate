-- =====================================================================
-- 0010 · Tipos de producto
-- ---------------------------------------------------------------------
-- Cada producto puede tener uno o más "tipos" (un mate puede ser de
-- calabaza Y camionero a la vez). Se marcan en el panel, al cargar o editar
-- un producto. En la tienda, la sección "¿Cuál es tu tipo de mate?" usa los
-- tipos para el botón "Ver en catálogo".
--
-- Tipos posibles (los mismos de MateTypes.tsx):
--   material: calabaza, algarrobo, acero
--   forma:    camionero, torpedo, imperial
--   bombilla: bombilla, bombillon
--
-- Se corre una sola vez en Supabase > SQL Editor. No borra nada.
-- La regla de quién puede leer y escribir es la misma de siempre (RLS de
-- products): el público lee, solo el admin escribe.
-- =====================================================================

alter table public.products
  add column if not exists types text[] not null default '{}';

alter table public.products drop constraint if exists products_types_check;
alter table public.products
  add constraint products_types_check
  check (types <@ array['calabaza', 'algarrobo', 'acero', 'camionero', 'torpedo', 'imperial', 'bombilla', 'bombillon']::text[]);

-- Arranque: se marcan solos los tipos que ya se deducen de cada producto.
-- Después se revisan y completan a mano en el panel (sobre todo la forma).
--  - mates: el material sale del campo "Material"; la forma, del nombre.
--  - bombillas: "bombillón" en el nombre = bombillón; si no, bombilla.
--  Solo se toca a los productos que todavía no tienen ningún tipo.
update public.products p
set types = array(
  select distinct t
  from unnest(array[
    case when c.slug = 'mates' and p.material ilike '%calabaza%' then 'calabaza' end,
    case when c.slug = 'mates' and p.material ilike '%algarrobo%' then 'algarrobo' end,
    case when c.slug = 'mates' and p.material ilike '%acero%' then 'acero' end,
    case when c.slug = 'mates' and p.name ilike '%camionero%' then 'camionero' end,
    case when c.slug = 'mates' and p.name ilike '%torpedo%' then 'torpedo' end,
    case when c.slug = 'mates' and p.name ilike '%imperial%' then 'imperial' end,
    case when c.slug = 'bombillas' and p.name ~* 'bombill[oó]n' then 'bombillon' end,
    case when c.slug = 'bombillas' and p.name !~* 'bombill[oó]n' then 'bombilla' end
  ]) as t
  where t is not null
)
from public.categories c
where c.id = p.category_id
  and p.types = '{}';
