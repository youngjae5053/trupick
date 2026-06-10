-- MVP access rules for real customer/expert/admin flows.
-- Public pages can only read fully approved experts.
-- Logged-in experts can create and edit their own application/profile.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '') = 'true'
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    );
$$;

alter table public.experts enable row level security;

drop policy if exists "Public can read approved experts" on public.experts;
drop policy if exists "Admins can read all experts" on public.experts;
drop policy if exists "Admins can update experts" on public.experts;
drop policy if exists "Public can submit pending experts" on public.experts;
drop policy if exists "Users can read own expert profile" on public.experts;
drop policy if exists "Users can insert own expert profile" on public.experts;
drop policy if exists "Users can update own expert profile" on public.experts;

create policy "Public can read approved experts"
on public.experts
for select
to anon, authenticated
using (approved is true and approval_status = 'approved');

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

create policy "Users can read own expert profile"
on public.experts
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own expert profile"
on public.experts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and coalesce(approved, false) = false
  and coalesce(approval_status, 'draft') in ('draft', 'pending', 'pending_review')
);

create policy "Users can update own expert profile"
on public.experts
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or coalesce(approval_status, 'draft') in ('draft', 'pending', 'pending_review', 'approved', 'rejected')
  )
);

do $$
begin
  if to_regclass('public.requests') is not null then
    alter table public.requests enable row level security;

    drop policy if exists "Users can create own requests" on public.requests;
    drop policy if exists "Users can read own requests" on public.requests;
    drop policy if exists "Admins can read all requests" on public.requests;
    drop policy if exists "Admins can update all requests" on public.requests;
    drop policy if exists "Experts can read received requests" on public.requests;

    create policy "Users can create own requests"
    on public.requests
    for insert
    to authenticated
    with check (user_id = auth.uid());

    create policy "Users can read own requests"
    on public.requests
    for select
    to authenticated
    using (user_id = auth.uid());

    create policy "Experts can read received requests"
    on public.requests
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.experts
        where experts.id = requests.expert_id
          and experts.user_id = auth.uid()
      )
    );

    create policy "Admins can read all requests"
    on public.requests
    for select
    to authenticated
    using (public.is_admin());

    create policy "Admins can update all requests"
    on public.requests
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end $$;
