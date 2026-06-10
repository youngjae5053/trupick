alter table public.experts
drop constraint if exists experts_status_check;

alter table public.experts
add constraint experts_status_check
check (status in ('draft', 'pending', 'pending_review', 'approved', 'rejected'));

alter table public.experts
drop constraint if exists experts_approval_status_check;

alter table public.experts
add constraint experts_approval_status_check
check (approval_status in ('draft', 'pending', 'pending_review', 'approved', 'rejected'));

alter table public.experts
add column if not exists phone text,
add column if not exists activity_area text,
add column if not exists specialties text[] default '{}',
add column if not exists career_years text,
add column if not exists career_summary text,
add column if not exists profile_images text[] default '{}',
add column if not exists main_profile_image text,
add column if not exists intro_line text,
add column if not exists philosophy text,
add column if not exists cases jsonb default '[]'::jsonb,
add column if not exists profile_completion_score integer default 0,
add column if not exists detailed_location text,
add column if not exists center_name text,
add column if not exists map_address text,
add column if not exists latitude numeric,
add column if not exists longitude numeric,
add column if not exists video_url text,
add column if not exists extra_intro text,
add column if not exists admin_interview_done boolean default false,
add column if not exists admin_interview_memo text,
add column if not exists admin_site_visit_done boolean default false,
add column if not exists admin_video_shoot_done boolean default false,
add column if not exists admin_video_url text,
add column if not exists admin_featured_image text,
add column if not exists admin_verification_comment text,
add column if not exists admin_internal_score integer,
add column if not exists admin_approval_memo text;

create index if not exists experts_approval_status_idx
on public.experts (approval_status);

drop policy if exists "Experts can read own profiles" on public.experts;
drop policy if exists "Experts can update own profiles for review" on public.experts;

create policy "Experts can read own profiles"
on public.experts
for select
to authenticated
using (user_id = auth.uid());

create policy "Experts can update own profiles for review"
on public.experts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and coalesce(approved, false) = false);
