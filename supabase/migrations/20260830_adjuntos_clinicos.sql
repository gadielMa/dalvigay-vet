alter table public.consultas_nuevas add column if not exists adjuntos jsonb not null default '[]'::jsonb;
insert into storage.buckets (id, name, public)
values ('archivos-pacientes', 'archivos-pacientes', false)
on conflict (id) do nothing;
