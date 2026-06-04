alter table public.experts
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists experts_user_id_idx
on public.experts (user_id);
