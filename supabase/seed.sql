-- Carga inicial del catálogo (precios de Tiendanube, octubre 2026).
-- Ejecutar después de migrations/0001_catalogo.sql.

insert into public.categories (slug, name, sort_order) values
  ('mates',     'Mates',                   1),
  ('bombillas', 'Bombillas y bombillones', 2),
  ('termos',    'Termos',                  3);

insert into public.products
  (slug, name, category_id, shape, material, description, price, compare_at_price, stock, sort_order)
select v.slug, v.name, c.id, v.shape, v.material, v.description, v.price, v.compare_at_price, v.stock, v.sort_order
from (values
  ('camionero-premium',              'Camionero Premium',                  'mates',     'camionero',       'Calabaza',  'Calabaza con cuero labrado, cincelado en alpaca y base de bronce.', 34900, 41900, 1,    1),
  ('torpedo-criollo-base-regulable', 'Torpedo Criollo con base regulable', 'mates',     'torpedo',         'Calabaza',  'Mate torpedo criollo de calabaza con base regulable.',              24000, 26500, null, 2),
  ('ranchero-vaquita',               'Ranchero vaquita',                   'mates',     'ranchero',        'Algarrobo', null,                                                                25900, null,  null, 3),
  ('criollo-coquito',                'Criollo coquito',                    'mates',     'criollo',         null,        null,                                                                22900, null,  null, 4),
  ('imperial-algarrobo',             'Imperial de algarrobo',              'mates',     'imperial',        'Algarrobo', 'Mate imperial de madera de algarrobo.',                             20900, null,  null, 5),
  ('camionero-criollo-calabaza',     'Camionero criollo de calabaza',      'mates',     'camionero',       'Calabaza',  'Mate camionero criollo de calabaza.',                               19900, null,  null, 6),
  ('camionero-algarrobo',            'Camionero de algarrobo',             'mates',     'camionero',       'Algarrobo', 'Mate camionero de madera de algarrobo.',                            18900, null,  null, 7),
  ('bombillon-semicurvo-premium',    'Bombillón semicurvo premium',        'bombillas', 'bombillon-curvo', null,        null,                                                                23800, null,  null, 8),
  ('bombillon-recto',                'Bombillón recto',                    'bombillas', 'bombillon',       null,        null,                                                                20800, null,  null, 9),
  ('bombilla-pico-loro-bronce',      'Bombilla pico loro en bronce',       'bombillas', 'loro',            'Bronce',    null,                                                                 7000, null,  null, 10),
  ('bombilla-pico-loro',             'Bombilla pico loro',                 'bombillas', 'loro',            null,        null,                                                                 7000, null,  null, 11),
  ('termo-1-2l',                     'Termo 1,2 L',                        'termos',    'termo',           null,        null,                                                                35000, null,  null, 12)
) as v (slug, name, category_slug, shape, material, description, price, compare_at_price, stock, sort_order)
join public.categories c on c.slug = v.category_slug;
