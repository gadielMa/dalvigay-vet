-- Copia idempotente de los artículos importados desde MySQL.
-- La tabla legacy se conserva sin modificaciones.
insert into public.inventario (nombre, categoria, stock, stock_minimo, precio, proveedor, codigo_barras)
select
  trim(a.art_desc),
  concat('Línea ', coalesce(a.art_linea::text, '0')),
  greatest(coalesce(a.art_cant, 0), 0),
  0,
  greatest(coalesce(nullif(a.art_precio_efe, 0), a.art_precio_costo, 0), 0),
  nullif(a.art_proveedor::text, '0'),
  nullif(trim(a.art_codigo), '')
from public.articulos a
where trim(a.art_desc) <> ''
  and not exists (select 1 from public.inventario i where i.codigo_barras = nullif(trim(a.art_codigo), ''));
