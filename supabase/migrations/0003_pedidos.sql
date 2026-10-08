-- unmate.es · Etapa 2: pedidos registrados con número y estado.
-- Se ejecuta una sola vez en Supabase (SQL Editor).

-- ---------------------------------------------------------------- tablas

-- Un pedido. Su id es el "número de pedido" que ve el cliente.
create table public.orders (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  customer_name text,
  note          text,
  status        text not null default 'pendiente'
                check (status in ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total         integer not null                      -- pesos
);

-- Los renglones del pedido. Se guarda una copia del nombre y del precio del
-- momento: si después el producto cambia o se borra, el pedido queda igual.
create table public.order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint not null references public.orders (id) on delete cascade,
  product_id   bigint references public.products (id) on delete set null,
  product_name text not null,
  by_weight    boolean not null,                       -- true = yerba
  quantity     integer not null check (quantity > 0),  -- unidades, o gramos si by_weight
  unit_price   integer not null,                       -- precio de la unidad, o del kilo
  line_total   integer not null
);

-- ------------------------------------------------------------- seguridad
-- Los pedidos solo los ve y los maneja el admin. El público no puede leer
-- ni escribir estas tablas directamente: crea pedidos únicamente a través
-- de la función create_order de más abajo.

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

grant select, update, delete on public.orders, public.order_items to authenticated;

create policy "admin maneja pedidos" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin maneja renglones" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------- crear un pedido
-- La llama la tienda cuando el cliente toca "Enviar pedido por WhatsApp".
-- Recibe solo qué productos y cuánto: los precios los pone la base, así
-- nadie puede inventar un precio desde el navegador.
--   p_items: [{"slug": "ranchero-vaquita", "qty": 1}, {"slug": "yerba-x", "qty": 750}]
-- Devuelve {"number": 12, "total": 31900}.

create function public.create_order(p_items jsonb, p_name text default null, p_note text default null)
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
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Pedido inválido';
  end if;

  insert into public.orders (customer_name, note, total)
  values (nullif(left(trim(p_name), 80), ''), nullif(left(trim(p_note), 500), ''), 0)
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

    -- la yerba se cobra por la parte del kilo que corresponda
    v_line := case when v_product.by_weight
                   then round(v_product.price * v_qty / 1000.0)::integer
                   else v_product.price * v_qty end;

    insert into public.order_items (order_id, product_id, product_name, by_weight, quantity, unit_price, line_total)
    values (v_order, v_product.id, v_product.name, v_product.by_weight, v_qty, v_product.price, v_line);

    v_total := v_total + v_line;
  end loop;

  update public.orders set total = v_total where id = v_order;
  return jsonb_build_object('number', v_order, 'total', v_total);
end;
$$;

revoke all on function public.create_order(jsonb, text, text) from public;
grant execute on function public.create_order(jsonb, text, text) to anon, authenticated;

-- ------------------------------------------- cambiar el estado de un pedido
-- La llama el panel. Además de cambiar el estado, mueve el stock:
--   al pasar a confirmado/entregado  -> descuenta lo pedido;
--   al volver a pendiente/cancelado  -> lo devuelve.
-- Solo toca productos que tienen stock cargado (los "sin control" se ignoran).

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
              from public.order_items where order_id = p_order group by product_id) i
     where p.id = i.product_id and p.stock is not null;
  elsif v_was_taken and not v_takes then
    update public.products p
       set stock = p.stock + i.qty
      from (select product_id, sum(quantity)::integer as qty
              from public.order_items where order_id = p_order group by product_id) i
     where p.id = i.product_id and p.stock is not null;
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

revoke all on function public.set_order_status(bigint, text) from public;
grant execute on function public.set_order_status(bigint, text) to authenticated;
