-- unmate.es · Yerba suelta o en paquete, con su ajuste de precio propio;
-- y reseñas con foto del cliente y portada.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0004.

-- =====================================================================
-- 1. YERBA: cada producto decide cómo se vende
-- Hasta ahora "todo lo de la categoría yerba va por peso". Ahora lo dice
-- cada producto, así en la misma categoría conviven:
--   - yerba suelta (by_weight = true): precio por kilo, stock en gramos;
--   - paquetes (by_weight = false): se venden por unidad, como una bombilla.
-- Y el ajuste por cantidad pasa a ser de cada yerba:
--   weight_extra    = % más caro el kilo si se lleva menos de 1 kg
--   weight_discount = % más barato el kilo si se llevan 2 kg o más
-- (La fila 'yerba_tiers' de la tabla settings queda sin uso.)
-- =====================================================================

alter table public.products
  add column by_weight       boolean not null default false,
  add column weight_extra    integer not null default 0 check (weight_extra between 0 and 90),
  add column weight_discount integer not null default 0 check (weight_discount between 0 and 90);

-- lo que ya estaba cargado en la categoría yerba era todo yerba suelta
update public.products p
   set by_weight = true
  from public.categories c
 where c.id = p.category_id and c.slug = 'yerba';

-- =====================================================================
-- 2. RESEÑAS: foto del cliente y portada
--   avatar   = foto chica que va al lado del nombre
--   featured = true: es de las que se ven siempre; las demás aparecen al
--              tocar "Ver todas las reseñas"
-- =====================================================================

alter table public.reviews
  add column avatar   text,
  add column featured boolean not null default false;

-- =====================================================================
-- 3. CREAR UN PEDIDO, con el ajuste de precio propio de cada yerba
-- Reemplaza la versión de 0004. Cambia de dónde sale si un producto va por
-- peso (ahora products.by_weight) y su porcentaje (weight_extra /
-- weight_discount). La cuenta es la misma que hace la tienda (weightPrice,
-- en src/lib/types.ts): parte del kilo, con el ajuste, redondeado a $ 10.
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

    select p.id, p.name, p.price, p.by_weight, p.weight_extra, p.weight_discount
      into v_product
      from public.products p
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
