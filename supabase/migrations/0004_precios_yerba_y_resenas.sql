-- unmate.es · Precio de la yerba según la cantidad, y reseñas.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0003.

-- =====================================================================
-- 1. AJUSTES GENERALES
-- Una tabla chica de "clave -> valor" para configuraciones de la tienda.
-- Hoy guarda una sola: los tramos de precio de la yerba.
-- =====================================================================

create table public.settings (
  key   text primary key,
  value jsonb not null
);

alter table public.settings enable row level security;
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;

create policy "publico lee ajustes" on public.settings
  for select to anon, authenticated using (true);
create policy "admin escribe ajustes" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tramos de precio de la yerba: "desde `min` gramos, el kilo cambia `percent` %".
-- +10 = 10 % más caro; -8 = 8 % más barato. Arranca neutro (sin ajuste):
-- los porcentajes se cargan desde el panel, sección Yerba.
insert into public.settings (key, value)
values ('yerba_tiers', '[{"min": 0, "percent": 0}]');

-- =====================================================================
-- 2. RESEÑAS
-- Las carga el admin desde el panel: nombre, fotos que le mandó el cliente
-- y, si quiere, unas palabras.
-- =====================================================================

create table public.reviews (
  id         bigint generated always as identity primary key,
  name       text not null,
  text       text,
  photos     text[] not null default '{}',   -- ubicaciones en el bucket "productos"
  is_active  boolean not null default true,  -- false = oculta en la tienda
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

create policy "publico lee reseñas visibles" on public.reviews
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "admin escribe reseñas" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 3. CREAR UN PEDIDO, ahora con el precio de la yerba por tramos
-- Reemplaza la versión de 0003. Lo único que cambia es cómo se calcula el
-- renglón de yerba: parte del kilo que corresponda, con el ajuste de su
-- tramo, redondeado a $ 10. Es la misma cuenta que hace la tienda
-- (weightPrice, en src/lib/types.ts).
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
  v_tiers   jsonb;
  v_percent integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Pedido inválido';
  end if;

  v_visitor := case when length(p_visitor) between 8 and 64 then p_visitor end;
  select value into v_tiers from public.settings where key = 'yerba_tiers';

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

    if v_product.by_weight then
      -- tramo que corresponde: el de mayor "min" que no supere la cantidad
      select (t ->> 'percent')::integer into v_percent
        from jsonb_array_elements(coalesce(v_tiers, '[]'::jsonb)) t
       where (t ->> 'min')::integer <= v_qty
       order by (t ->> 'min')::integer desc
       limit 1;
      v_line := (round(v_product.price::numeric * v_qty * (100 + coalesce(v_percent, 0)) / 1000000) * 10)::integer;
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

  update public.orders set total = v_total where id = v_order;

  -- ese visitante ya pidió: su carrito deja de contar como "sin terminar"
  if v_visitor is not null then
    delete from public.carts where visitor = v_visitor;
  end if;

  return jsonb_build_object('number', v_order, 'total', v_total);
end;
$$;
