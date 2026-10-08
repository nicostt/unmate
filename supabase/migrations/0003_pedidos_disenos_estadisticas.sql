-- unmate.es · Pedidos, diseños y estadísticas.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0001.

-- =====================================================================
-- 1. DISEÑOS
-- Un producto "por diseños" (products.by_design) es un tipo de mate cuyas
-- unidades son piezas únicas: cada una es un diseño con su número y sus
-- fotos. Su stock es la cantidad de diseños cargados; el número de
-- products.stock no se usa. Un diseño sale de la tienda cuando el admin
-- lo elimina.
-- =====================================================================

alter table public.products
  add column by_design boolean not null default false;

create table public.product_designs (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  number     integer not null,                    -- "Diseño #3"
  created_at timestamptz not null default now(),
  unique (product_id, number)
);

-- Las fotos de un diseño son filas de product_media con design_id cargado.
-- Las que tienen design_id vacío son fotos generales del producto.
alter table public.product_media
  add column design_id bigint references public.product_designs (id) on delete cascade;

alter table public.product_designs enable row level security;
grant select on public.product_designs to anon, authenticated;
grant insert, update, delete on public.product_designs to authenticated;

create policy "publico lee diseños" on public.product_designs
  for select to anon, authenticated using (true);
create policy "admin escribe diseños" on public.product_designs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 2. PEDIDOS
-- =====================================================================

-- Un pedido. Su id es el "número de pedido" que ve el cliente.
create table public.orders (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  visitor       text,                              -- identificador anónimo del navegador
  customer_name text,
  note          text,
  status        text not null default 'pendiente'
                check (status in ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total         integer not null                   -- pesos
);

-- Los renglones del pedido. Se guarda una copia del nombre, del precio y del
-- diseño del momento: si después el producto cambia o se borra, el pedido
-- queda igual.
create table public.order_items (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  product_id    bigint references public.products (id) on delete set null,
  product_name  text not null,
  by_weight     boolean not null,                       -- true = yerba
  quantity      integer not null check (quantity > 0),  -- unidades, o gramos si by_weight
  unit_price    integer not null,                       -- precio de la unidad, o del kilo
  line_total    integer not null,
  design_id     bigint references public.product_designs (id) on delete set null,
  design_number integer,                                -- copia del número de diseño
  design_photo  text                                    -- copia de la ubicación de su foto
);

-- Los pedidos solo los ve y los maneja el admin. El público los crea
-- únicamente a través de la función create_order.
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

grant select, update, delete on public.orders, public.order_items to authenticated;

create policy "admin maneja pedidos" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin maneja renglones" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 3. ESTADÍSTICAS
-- Datos anónimos: no se guarda nombre, teléfono ni dirección. "visitor" es
-- un código al azar que se genera en cada navegador.
-- =====================================================================

-- Cosas que pasan en la tienda.
--   visit  = alguien entró              view  = abrió la ficha de un producto
--   add    = agregó al carrito          search = buscó algo (detail = lo que escribió)
--   order  = mandó un pedido
create table public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor    text not null,
  type       text not null check (type in ('visit', 'view', 'add', 'search', 'order')),
  product_id bigint references public.products (id) on delete set null,
  design_id  bigint references public.product_designs (id) on delete set null,
  detail     text,       -- texto buscado
  value      integer,    -- cuántos resultados dio la búsqueda
  source     text,       -- de dónde llegó: instagram, whatsapp, google, directo...
  device     text        -- celular o compu
);
create index events_created_at_idx on public.events (created_at);

-- El carrito actual de cada visitante, para saber cuántos hay sin terminar.
-- Se borra solo cuando ese visitante manda el pedido o vacía el carrito.
create table public.carts (
  visitor    text primary key,
  items      jsonb not null,     -- [{"slug": "...", "qty": 1, "design": 12}]
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.carts  enable row level security;

grant select, delete on public.events, public.carts to authenticated;

create policy "admin lee eventos" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin lee carritos" on public.carts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anota un evento. La llama la tienda desde el navegador del visitante.
create function public.track(
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

revoke all on function public.track(text, text, text, bigint, text, integer, text, text) from public;
grant execute on function public.track(text, text, text, bigint, text, integer, text, text) to anon, authenticated;

-- Guarda cómo está el carrito de un visitante (o lo borra si quedó vacío).
create function public.save_cart(p_visitor text, p_items jsonb)
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
  if jsonb_array_length(p_items) > 50 then
    return;
  end if;

  insert into public.carts (visitor, items, updated_at)
  values (p_visitor, p_items, now())
  on conflict (visitor) do update set items = excluded.items, updated_at = now();
end;
$$;

revoke all on function public.save_cart(text, jsonb) from public;
grant execute on function public.save_cart(text, jsonb) to anon, authenticated;

-- =====================================================================
-- 4. CREAR UN PEDIDO
-- La llama la tienda cuando el cliente toca "Enviar pedido por WhatsApp".
-- Recibe solo qué productos y cuánto: los precios los pone la base, así
-- nadie puede inventar un precio desde el navegador.
--   p_items: [{"slug": "imperial-algarrobo", "qty": 1, "design": 12},
--             {"slug": "yerba-x", "qty": 750}]
-- Devuelve {"number": 12, "total": 31900}.
-- No toca el stock ni borra diseños: eso lo decide el admin desde el panel.
-- =====================================================================

create function public.create_order(
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
begin
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

    select p.id, p.name, p.price, (c.slug = 'yerba') as by_weight
      into v_product
      from public.products p
      join public.categories c on c.id = p.category_id
     where p.slug = v_item ->> 'slug' and p.is_active;
    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'slug';
    end if;

    -- ¿eligió un diseño puntual? Tiene que existir y ser de ese producto.
    v_design := nullif(v_item ->> 'design', '')::bigint;
    v_number := null;
    v_photo  := null;
    if v_design is not null then
      select d.number into v_number
        from public.product_designs d
       where d.id = v_design and d.product_id = v_product.id;
      if not found then
        raise exception 'Ese diseño ya no está disponible';
      end if;
      v_qty := 1;   -- cada diseño es una pieza única
      select m.path into v_photo
        from public.product_media m
       where m.design_id = v_design and m.kind = 'image'
       order by m.sort_order
       limit 1;
    end if;

    -- la yerba se cobra por la parte del kilo que corresponda
    v_line := case when v_product.by_weight
                   then round(v_product.price * v_qty / 1000.0)::integer
                   else v_product.price * v_qty end;

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

  update public.orders set total = v_total where id = v_order;

  -- ese visitante ya pidió: su carrito deja de contar como "sin terminar"
  if v_visitor is not null then
    delete from public.carts where visitor = v_visitor;
  end if;

  return jsonb_build_object('number', v_order, 'total', v_total);
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text) from public;
grant execute on function public.create_order(jsonb, text, text, text) to anon, authenticated;

-- =====================================================================
-- 5. CAMBIAR EL ESTADO DE UN PEDIDO
-- La llama el panel. Además de cambiar el estado, mueve el stock numérico:
--   al pasar a confirmado/entregado  -> descuenta lo pedido;
--   al volver a pendiente/cancelado  -> lo devuelve.
-- No toca los productos sin stock cargado ni los diseños: un diseño solo
-- sale de la tienda cuando el admin lo elimina.
-- =====================================================================

create function public.set_order_status(p_order bigint, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old       text;
  v_was_taken boolean;
  v_takes     boolean;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('pendiente', 'confirmado', 'entregado', 'cancelado') then
    raise exception 'Estado inválido';
  end if;

  select status into v_old from public.orders where id = p_order for update;
  if not found then
    raise exception 'El pedido no existe';
  end if;

  v_was_taken := v_old    in ('confirmado', 'entregado');
  v_takes     := p_status in ('confirmado', 'entregado');

  if v_takes and not v_was_taken then
    update public.products p
       set stock = greatest(p.stock - i.qty, 0)
      from (select product_id, sum(quantity)::integer as qty
              from public.order_items
             where order_id = p_order and design_id is null
             group by product_id) i
     where p.id = i.product_id and p.stock is not null and not p.by_design;
  elsif v_was_taken and not v_takes then
    update public.products p
       set stock = p.stock + i.qty
      from (select product_id, sum(quantity)::integer as qty
              from public.order_items
             where order_id = p_order and design_id is null
             group by product_id) i
     where p.id = i.product_id and p.stock is not null and not p.by_design;
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

revoke all on function public.set_order_status(bigint, text) from public;
grant execute on function public.set_order_status(bigint, text) to authenticated;
