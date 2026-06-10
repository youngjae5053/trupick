alter table public.experts
add column if not exists details jsonb default '{}'::jsonb;

create index if not exists experts_details_gin_idx
on public.experts using gin (details);
