alter table public.experts
add column if not exists status text default 'pending';

alter table public.experts
drop constraint if exists experts_status_check;

alter table public.experts
add constraint experts_status_check
check (status in ('pending', 'approved', 'rejected'));

update public.experts
set status = case
  when approved is true then 'approved'
  when status is null then 'pending'
  else status
end;
