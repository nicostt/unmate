-- unmate.es · Stock al confirmar y al entregar, y control de stock al pedir.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0005.

-- =====================================================================
-- 1. Un diseño puede estar apartado por un pedido confirmado
-- Un diseño es una pieza única: "bajar el stock" de un mate por diseños es
-- que esa pieza deje de estar disponible. Mientras el pedido está
-- confirmado queda apartada (is_hidden) y no se ofrece en la tienda.
-- =====================================================================

alter table public.product_designs
  add column is_hidden boolean not null default false;

-- El público deja de ver los diseños apartados; el admin los ve todos.
drop policy "publico lee diseños" on public.product_designs;
create policy "publico lee diseños visibles" on public.product_designs
  for select to anon, authenticated using (not is_hidden or public.is_admin());

-- =====================================================================
-- 2. CAMBIAR EL ESTADO DE UN PEDIDO
-- Reemplaza la versión de 0003. Qué pasa con el stock en cada estado:
--
--   pendiente   -> nada: todo sigue a la venta.
--   confirmado  -> BAJA EL STOCK: se descuentan las unidades (o los gramos
--                  de yerba) y los diseños pedidos quedan apartados.
--   entregado   -> DEFINITIVO: el stock ya descontado queda así y los
--                  diseños se eliminan. Desde acá no se vuelve atrás.
--   cancelado   -> se libera lo de un pedido confirmado: el stock vuelve y
--                  los diseños reaparecen.
--
-- Un pedido entregado no cambia más de estado: solo se puede borrar del
-- historial, y borrarlo no devuelve stock.
-- =====================================================================

create or replace function public.set_order_status(p_order bigint, p_status text)
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
  if v_old = 'entregado' then
    raise exception 'Un pedido entregado es definitivo y no cambia de estado';
  end if;

  v_was_taken := v_old    = 'confirmado';
  v_takes     := p_status in ('confirmado', 'entregado');

  -- stock numérico (productos sin diseños, con stock cargado)
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

  -- diseños: apartados mientras el pedido esté confirmado; libres si se cancela
  update public.product_designs
     set is_hidden = v_takes
   where id in (select design_id from public.order_items
                 where order_id = p_order and design_id is not null);

  -- entregado: los diseños se eliminan. Sus fotos salen con ellos de la
  -- tabla; el pedido se queda con la copia del número y de la foto principal.
  if p_status = 'entregado' then
    delete from public.product_designs
     where id in (select design_id from public.order_items
                   where order_id = p_order and design_id is not null);
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

-- =====================================================================
-- 3. CREAR UN PEDIDO, ahora controlando el stock
-- Reemplaza la versión de 0005. Si algo de lo pedido no tiene stock
-- suficiente (o el diseño ya no está disponible), el pedido NO se registra
-- y la función avisa con un mensaje que empieza con "SIN_STOCK:" seguido
-- del nombre del producto. La tienda lo usa para avisarle al cliente.
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

  update public.orders set total = v_total where id = v_order;

  -- ese visitante ya pidió: su carrito deja de contar como "sin terminar"
  if v_visitor is not null then
    delete from public.carts where visitor = v_visitor;
  end if;

  return jsonb_build_object('number', v_order, 'total', v_total);
end;
$$;
