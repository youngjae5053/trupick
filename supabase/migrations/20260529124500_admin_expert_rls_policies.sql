-- Enforce public/admin access rules for expert records.
-- Admin users are identified by Supabase Auth app_metadata:
--   { "role": "admin" }
-- or
--   { "is_admin": true }

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '') = 'true';
$$;

alter table public.experts enable row level security;

drop policy if exists "Public can read approved experts" on public.experts;
drop policy if exists "Admins can read all experts" on public.experts;
drop policy if exists "Admins can update experts" on public.experts;
drop policy if exists "Public can submit pending experts" on public.experts;

create policy "Public can read approved experts"
on public.experts
for select
to anon, authenticated
using (approved is true);

create policy "Admins can read all experts"
on public.experts
for select
to authenticated
using (public.is_admin());

create policy "Admins can update experts"
on public.experts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can submit pending experts"
on public.experts
for insert
to anon, authenticated
with check (coalesce(approved, false) = false);
