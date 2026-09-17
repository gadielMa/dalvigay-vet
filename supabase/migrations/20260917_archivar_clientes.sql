-- Archivar conserva la ficha, mascotas e historia clínica del cliente.
-- No se elimina información médica ni administrativa.
alter table public.clientes
  add column if not exists cli_archivado boolean not null default false;

create index if not exists clientes_archivados_idx
  on public.clientes (cli_archivado, cli_apellido, cli_nombre);
