-- =====================================================================
-- 0009 · "Lo quiero" en los productos agotados
-- ---------------------------------------------------------------------
-- En la tienda, el botón de un producto sin stock dice "Agotado · Lo
-- quiero". Al tocarlo se anota un evento 'want' (anónimo, como el resto de
-- las estadísticas) y el panel muestra cuántas personas pidieron cada
-- producto agotado (pestaña Estadísticas, "Lo piden sin stock").
--
-- Se corre una sola vez en Supabase > SQL Editor. No borra nada.
-- =====================================================================

-- 1. La tabla de eventos acepta el tipo nuevo.
alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type in ('visit', 'view', 'add', 'search', 'order', 'want'));

-- 2. track acepta 'want'. Igual que la versión de 0008 (mismo freno de
--    abusos y mismos recortes), más dos reglas para 'want':
--    - tiene que ser de un producto que exista;
--    - cuenta UNA vez por persona y producto: si alguien lo toca diez
--      veces, queda anotado una sola.
create or replace function public.track(
  p_visitor text,
  p_type    text,
  p_slug    text    default null,
  p_design  bigint  default null,
  p_detail  text    default null,
  p_value   integer default null,
  p_source  text    default null,
  p_device  text    default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product bigint;
begin
  if p_visitor is null or length(p_visitor) not between 8 and 64 then
    return;
  end if;
  if p_type not in ('visit', 'view', 'add', 'search', 'want') then
    return;   -- 'order' solo lo anota create_order
  end if;
  -- como mucho 240 eventos cada 5 minutos desde la misma conexión
  if public.too_many('evento', 240, 300) then
    return;
  end if;

  v_product := (select id from public.products where slug = p_slug);

  if p_type = 'want' then
    if v_product is null then
      return;
    end if;
    if exists (
      select 1 from public.events
      where type = 'want' and visitor = p_visitor and product_id = v_product
    ) then
      return;
    end if;
  end if;

  insert into public.events (visitor, type, product_id, design_id, detail, value, source, device)
  values (
    p_visitor,
    p_type,
    v_product,
    (select id from public.product_designs where id = p_design),
    nullif(left(trim(p_detail), 80), ''),
    p_value,
    nullif(left(trim(p_source), 30), ''),
    nullif(left(trim(p_device), 10), '')
  );
end;
$$;

-- Los permisos de la función no cambian (create or replace los conserva).
