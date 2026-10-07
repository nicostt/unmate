-- unmate.es · Etapa 1: catálogo, administrador y archivos.
-- Se ejecuta una sola vez en Supabase (SQL Editor) sobre un proyecto nuevo.

-- ---------------------------------------------------------------- tablas

create table public.categories (
  id         bigint generated always as identity primary key,
  slug       text not null unique,          -- "mates": lo que va en la URL
  name       text not null,                 -- "Mates": lo que lee el cliente
  sort_order integer not null default 0
);

create table public.products (
  id               bigint generated always as identity primary key,
  slug             text not null unique,
  name             text not null,
  category_id      bigint not null references public.categories (id),
  shape            text not null default 'camionero', -- ilustración mientras no hay foto
  material         text,
  description      text,
  price            integer not null check (price >= 0),          -- pesos, sin centavos
  compare_at_price integer check (compare_at_price > price),     -- precio "antes"
  stock            integer check (stock >= 0),                   -- vacío = no se controla
  is_active        boolean not null default true,                -- false = oculto en la web
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Fotos y videos de cada producto. El archivo vive en Storage; acá se guarda
-- solo su ubicación (path) dentro del bucket "productos".
create table public.product_media (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  kind       text not null check (kind in ('image', 'video')),
  path       text not null,
  alt        text,
  sort_order integer not null default 0
);

-- Quién es administrador. Hoy tiene una sola fila: el usuario de Nicolás.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ¿El usuario que hace el pedido es administrador? La usan las reglas de abajo.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- ------------------------------------------- seguridad (Row Level Security)
-- Con RLS activado nadie puede hacer nada salvo lo que una regla permita.
-- Regla general: el público solo lee el catálogo; solo el admin escribe.

alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.product_media enable row level security;
alter table public.admins        enable row level security; -- sin reglas: nadie la toca desde la web

grant select on public.categories, public.products, public.product_media to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_media to authenticated;

create policy "publico lee categorias" on public.categories
  for select to anon, authenticated using (true);
create policy "admin escribe categorias" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El público ve solo los productos activos; el admin ve todos.
create policy "publico lee productos activos" on public.products
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "admin escribe productos" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "publico lee fotos y videos" on public.product_media
  for select to anon, authenticated using (true);
create policy "admin escribe fotos y videos" on public.product_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------ archivos (Storage)
-- Bucket público: cualquiera puede ver una foto si tiene el link, pero solo
-- el admin puede subir, reemplazar, listar o borrar.

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "admin lista archivos" on storage.objects
  for select to authenticated using (bucket_id = 'productos' and public.is_admin());
create policy "admin sube archivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.is_admin());
create policy "admin reemplaza archivos" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.is_admin());
create policy "admin borra archivos" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.is_admin());
