alter table public.experts
add column if not exists phone text,
add column if not exists activity_area text,
add column if not exists specialties text[] default '{}',
add column if not exists intro_line text,
add column if not exists career_years text,
add column if not exists career_summary text,
add column if not exists main_profile_image text,
add column if not exists cases jsonb default '[]'::jsonb,
add column if not exists profile_completion_score integer default 0,
add column if not exists updated_at timestamptz default now(),
add column if not exists details jsonb default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'experts'
      and column_name = 'profile_images'
      and data_type <> 'jsonb'
  ) then
    alter table public.experts
    alter column profile_images drop default;

    alter table public.experts
    alter column profile_images type jsonb
    using to_jsonb(coalesce(profile_images, array[]::text[]));

    alter table public.experts
    alter column profile_images set default '[]'::jsonb;
  else
    alter table public.experts
    add column if not exists profile_images jsonb default '[]'::jsonb;
  end if;
end $$;

create index if not exists experts_details_gin_idx
on public.experts using gin (details);
