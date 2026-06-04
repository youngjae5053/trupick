alter table public.experts
add column if not exists approval_status text default 'pending';

alter table public.experts
drop constraint if exists experts_approval_status_check;

alter table public.experts
add constraint experts_approval_status_check
check (approval_status in ('pending', 'approved', 'rejected'));

alter table public.experts
add column if not exists certifications text[] default '{}';

alter table public.experts
add column if not exists portfolio_url text;

alter table public.experts
add column if not exists sns_url text;

update public.experts
set approval_status = case
  when approved is true then 'approved'
  when approval_status is null then 'pending'
  else approval_status
end;
