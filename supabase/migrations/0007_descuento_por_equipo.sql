-- unmate.es · Descuento por armar equipo.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0006.
--
-- La regla, igual en la tienda (src/lib/types.ts, kitSaving) y acá:
--   El equipo tiene cuatro partes: mate, bombilla, termo y yerba en paquete
--   (categorías "mates", "bombillas", "termos" y "yerba"; la yerba suelta
--   no cuenta). Si el pedido trae productos de `min` partes o más, se
--   descuenta un `percent` % sobre UN producto de cada parte (el más caro),
--   redondeado a $ 10.
-- El porcentaje y el mínimo se cambian desde el panel (pestaña Productos).

-- =====================================================================
-- 1. Cuánto se descontó en cada pedido
-- =====================================================================

alter table public.orders
  add column discount integer not null default 0;   -- pesos; ya está restado de `total`

-- =====================================================================
-- 2. El ajuste: arranca apagado (0 %), a partir de 3 partes
-- =====================================================================

insert into public.settings (key, value)
values ('kit_discount', '{"percent": 0, "min": 3}')
on conflict (key) do nothing;

-- =====================================================================
-- 3. CREAR UN PEDIDO, ahora con el descuento por equipo
-- Reemplaza la versión de 0006. Todo lo demás queda igual.
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
