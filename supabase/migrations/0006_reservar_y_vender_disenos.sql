-- unmate.es · Al confirmar un pedido, sus diseños se ocultan de la tienda;
-- al entregarlo, se eliminan.
-- Se ejecuta una sola vez en Supabase (SQL Editor), entero, después de 0005.

-- =====================================================================
-- 1. Un diseño puede estar oculto (reservado por un pedido confirmado)
-- =====================================================================

alter table public.product_designs
  add column is_hidden boolean not null default false;

-- El público deja de ver los diseños ocultos; el admin los ve todos.
drop policy "publico lee diseños" on public.product_designs;
create policy "publico lee diseños visibles" on public.product_designs
  for select to anon, authenticated using (not is_hidden or public.is_admin());

-- =====================================================================
-- 2. CAMBIAR EL ESTADO DE UN PEDIDO
-- Reemplaza la versión de 0003. Qué pasa con lo pedido en cada estado:
--
--   pendiente   -> nada: todo sigue a la venta.
--   confirmado  -> queda apartado: el stock numérico se descuenta y los
--                  diseños se ocultan de la tienda.
--   entregado   -> vendido: lo anterior, y además los diseños se ELIMINAN
--                  (el pedido conserva su número y su foto como historial).
--   cancelado   -> se libera: el stock vuelve y los diseños reaparecen
--                  (salvo los ya eliminados por una entrega).
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

  v_was_taken := v_old    in ('confirmado', 'entregado');
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

  -- diseños: ocultos mientras el pedido esté confirmado; visibles si se libera
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
