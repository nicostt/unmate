-- unmate.es · Refuerzos de seguridad.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0007.
--
-- Qué cambia:
--   1. Freno contra abusos: nadie puede mandar miles de pedidos o de datos
--      de estadísticas desde la misma conexión.
--   2. El carrito guardado para estadísticas tiene un tamaño máximo.
--   3. Las fotos de productos ocultos y de diseños apartados dejan de poder
--      consultarse desde afuera.
--   4. Al depósito de fotos solo entran imágenes, y de hasta 8 MB.

-- =====================================================================
-- 1. FRENO CONTRA ABUSOS
-- Las funciones que usa el público (anotar estadísticas, guardar el
-- carrito, crear un pedido) se pueden llamar sin iniciar sesión: así tiene
-- que ser, pero eso también deja que alguien las llame miles de veces con un
-- programa para llenar la base de basura. Acá se cuenta cuántas veces llama
-- cada conexión en un rato, y pasado un tope se la ignora.
--
-- La conexión se reconoce por su dirección IP, que Supabase informa en cada
-- pedido. No se guarda la IP sino un código derivado de ella, y los
-- registros de más de un día se borran solos.
-- =====================================================================

create table public.rate_limits (
  who    text        not null,              -- código derivado de la IP
  action text        not null,              -- 'pedido', 'evento' o 'carrito'
  slot   timestamptz not null,              -- comienzo del rato que se está contando
  hits   integer     not null default 1,    -- cuántas veces llamó en ese rato
  primary key (who, action, slot)
);

-- Sin reglas ni permisos: nadie la lee ni la toca desde la web.
alter table public.rate_limits enable row level security;

-- ¿Esta conexión ya hizo `p_action` más de `p_max` veces en los últimos
-- `p_seconds` segundos? También anota el intento.
create function public.too_many(p_action text, p_max integer, p_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers json;
  v_ip      text;
  v_slot    timestamptz;
  v_hits    integer;
begin
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := coalesce(
    nullif(v_headers ->> 'cf-connecting-ip', ''),
    nullif(trim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), '')
  );
  -- sin dirección no hay a quién contarle: se deja pasar
  if v_ip is null then
    return false;
  end if;

  v_slot := to_timestamp(floor(extract(epoch from now()) / p_seconds) * p_seconds);

  insert into public.rate_limits (who, action, slot)
  values (md5(v_ip), p_action, v_slot)
  on conflict (who, action, slot) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- cada tanto, limpieza de lo viejo
  if random() < 0.02 then
    delete from public.rate_limits where slot < now() - interval '1 day';
  end if;

  return v_hits > p_max;
end;
$$;

-- Es de uso interno: solo la llaman las funciones de abajo.
revoke all on function public.too_many(text, integer, integer) from public, anon, authenticated;

-- =====================================================================
-- 2. ESTADÍSTICAS Y CARRITO, con el freno
-- Reemplazan las versiones de 0003. Hacen lo mismo que antes.
-- =====================================================================

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
begin
  if p_visitor is null or length(p_visitor) not between 8 and 64 then
    return;
  end if;
  if p_type not in ('visit', 'view', 'add', 'search') then
    return;   -- 'order' solo lo anota create_order
  end if;
  -- como mucho 240 eventos cada 5 minutos desde la misma conexión
  if public.too_many('evento', 240, 300) then
    return;
  end if;

  insert into public.events (visitor, type, product_id, design_id, detail, value, source, device)
  values (
    p_visitor,
    p_type,
    (select id from public.products where slug = p_slug),
    (select id from public.product_designs where id = p_design),
    nullif(left(trim(p_detail), 80), ''),
    p_value,
    nullif(left(trim(p_source), 30), ''),
    nullif(left(trim(p_device), 10), '')
  );
end;
$$;

create or replace function public.save_cart(p_visitor text, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_visitor is null or length(p_visitor) not between 8 and 64 then
    return;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    delete from public.carts where visitor = p_visitor;
    return;
  end if;
  -- ni demasiados renglones ni un texto enorme disfrazado de carrito
  if jsonb_array_length(p_items) > 50 or length(p_items::text) > 6000 then
    return;
  end if;
  -- como mucho 120 guardados cada 5 minutos desde la misma conexión
  if public.too_many('carrito', 120, 300) then
    return;
  end if;

  insert into public.carts (visitor, items, updated_at)
  values (p_visitor, p_items, now())
  on conflict (visitor) do update set items = excluded.items, updated_at = now();
end;
$$;

-- =====================================================================
-- 3. CREAR UN PEDIDO, con el freno
-- Reemplaza la versión de 0007. Todo lo demás queda igual.
-- =====================================================================

create or replace function public.create_order(
  p_items   jsonb,
  p_name    text default null,
  p_note    text default null,
  p_visitor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   bigint;
  v_total   integer := 0;
  v_item    jsonb;
  v_qty     integer;
  v_line    integer;
  v_product record;
  v_design  bigint;
  v_number  integer;
  v_photo   text;
  v_visitor text;
  v_percent integer;
  -- descuento por equipo
  v_kit         jsonb;
  v_kit_percent integer;
  v_kit_min     integer;
  v_kit_parts   integer;
  v_kit_sum     integer;
  v_discount    integer := 0;
begin
  -- freno contra abusos: como mucho 6 pedidos cada 10 minutos desde la misma conexión.
  -- Si se pasa, no se registra nada y la tienda sigue por WhatsApp sin número de pedido.
  if public.too_many('pedido', 6, 600) then
    return jsonb_build_object('limited', true);
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Pedido inválido';
  end if;

  v_visitor := case when length(p_visitor) between 8 and 64 then p_visitor end;

  insert into public.orders (visitor, customer_name, note, total)
  values (v_visitor, nullif(left(trim(p_name), 80), ''), nullif(left(trim(p_note), 500), ''), 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 100000 then
      raise exception 'Cantidad inválida';
    end if;

    select p.id, p.name, p.price, p.stock, p.by_design, p.by_weight, p.weight_extra, p.weight_discount
      into v_product
      from public.products p
     where p.slug = v_item ->> 'slug' and p.is_active;
    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'slug';
    end if;

    v_design := nullif(v_item ->> 'design', '')::bigint;
    v_number := null;
    v_photo  := null;

    if v_product.by_design then
      -- tiene que ser un diseño de ese producto, y no estar apartado por otro pedido
      select d.number into v_number
        from public.product_designs d
       where d.id = v_design and d.product_id = v_product.id and not d.is_hidden;
      if not found then
        raise exception 'SIN_STOCK:%', v_product.name;
      end if;
      v_qty := 1;   -- cada diseño es una pieza única
      select m.path into v_photo
        from public.product_media m
       where m.design_id = v_design and m.kind = 'image'
       order by m.sort_order
       limit 1;
    else
      v_design := null;
      -- con stock cargado, no se puede pedir más de lo que hay
      -- (unidades, o gramos si es yerba suelta)
      if v_product.stock is not null and v_qty > v_product.stock then
        raise exception 'SIN_STOCK:%', v_product.name;
      end if;
    end if;

    if v_product.by_weight then
      -- menos de 1 kg: más caro · de 1 kg a menos de 2 kg: normal · 2 kg o más: más barato
      v_percent := case when v_qty < 1000  then v_product.weight_extra
                        when v_qty >= 2000 then -v_product.weight_discount
                        else 0 end;
      v_line := (round(v_product.price::numeric * v_qty * (100 + v_percent) / 1000000) * 10)::integer;
    else
      v_line := v_product.price * v_qty;
    end if;

    insert into public.order_items
      (order_id, product_id, product_name, by_weight, quantity, unit_price, line_total,
       design_id, design_number, design_photo)
    values
      (v_order, v_product.id, v_product.name, v_product.by_weight, v_qty, v_product.price, v_line,
       v_design, v_number, v_photo);

    if v_visitor is not null then
      insert into public.events (visitor, type, product_id, design_id)
      values (v_visitor, 'order', v_product.id, v_design);
    end if;

    v_total := v_total + v_line;
  end loop;

  -- Descuento por armar equipo: se cuenta de cuántas partes del equipo hay
  -- algo en el pedido y, de cada una, el producto más caro.
  select value into v_kit from public.settings where key = 'kit_discount';
  v_kit_percent := coalesce((v_kit ->> 'percent')::integer, 0);
  v_kit_min     := coalesce((v_kit ->> 'min')::integer, 3);

  if v_kit_percent between 1 and 90 and v_kit_min >= 2 then
    select count(*), coalesce(sum(parts.best), 0)
      into v_kit_parts, v_kit_sum
      from (select c.slug, max(i.unit_price) as best
              from public.order_items i
              join public.products p   on p.id = i.product_id
              join public.categories c on c.id = p.category_id
             where i.order_id = v_order
               and not i.by_weight
               and c.slug in ('mates', 'bombillas', 'termos', 'yerba')
             group by c.slug) parts;

    if v_kit_parts >= v_kit_min then
      v_discount := (round(v_kit_sum::numeric * v_kit_percent / 1000) * 10)::integer;
    end if;
  end if;

  update public.orders
     set total = v_total - v_discount, discount = v_discount
   where id = v_order;

  -- ese visitante ya pidió: su carrito deja de contar como "sin terminar"
  if v_visitor is not null then
    delete from public.carts where visitor = v_visitor;
  end if;

  return jsonb_build_object('number', v_order, 'total', v_total - v_discount, 'discount', v_discount);
end;
$$;

-- =====================================================================
-- 4. FOTOS: solo las de lo que está a la venta
-- Hasta ahora cualquiera podía pedirle a la base la lista de TODAS las
-- fotos, incluidas las de productos ocultos y diseños apartados. Ahora el
-- público solo ve las de productos visibles; el admin sigue viendo todas.
-- =====================================================================

drop policy if exists "publico lee fotos y videos" on public.product_media;

create policy "publico lee fotos de lo visible" on public.product_media
  for select to anon, authenticated using (
    public.is_admin()
    or (
      exists (select 1 from public.products p where p.id = product_id and p.is_active)
      and (
        design_id is null
        or exists (select 1 from public.product_designs d where d.id = design_id and not d.is_hidden)
      )
    )
  );

-- =====================================================================
-- 5. DEPÓSITO DE FOTOS: solo imágenes, de hasta 8 MB
-- El panel ya achica cada foto y la guarda como JPG; esto es un seguro por
-- si alguna vez se intenta subir otra cosa.
-- =====================================================================

update storage.buckets
   set file_size_limit = 8388608,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'productos';
