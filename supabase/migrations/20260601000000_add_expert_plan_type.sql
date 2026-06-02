alter table public.experts
add column if not exists plan_type text not null default 'free';

alter table public.experts
drop constraint if exists experts_plan_type_check;

alter table public.experts
add constraint experts_plan_type_check
check (plan_type in ('free', 'premium'));
