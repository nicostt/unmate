-- SIN USO: la yerba terminó vendiéndose por peso (ver WEIGHT_CATEGORY en
-- src/lib/types.ts) y esta tabla ya no se consulta. Queda registrada porque
-- se ejecutó en la base; se puede borrar con: drop table public.product_variants;
--
-- unmate.es · Presentaciones de un producto (por ejemplo yerba de 500 g y 1 kg).
-- Se ejecuta una sola vez en Supabase (SQL Editor), después de 0001.
--
-- Un producto SIN presentaciones se vende como hasta ahora, con el precio y el
-- stock de la tabla products. Un producto CON presentaciones se vende por
-- presentación: cada una tiene su propio precio y su propio stock.

create table public.product_variants (
  id               bigint generated always as identity primary key,
  product_id       bigint not null references public.products (id) on delete cascade,
  label            text not null,                              -- "500 g", "1 kg"
  price            integer not null check (price >= 0),        -- pesos, sin centavos
  compare_at_price integer check (compare_at_price > price),   -- precio "antes"
  stock            integer check (stock >= 0),                 -- vacío = no se controla
  sort_order       integer not null default 0
);

alter table public.product_variants enable row level security;

grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;

create policy "publico lee presentaciones" on public.product_variants
  for select to anon, authenticated using (true);
create policy "admin escribe presentaciones" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
