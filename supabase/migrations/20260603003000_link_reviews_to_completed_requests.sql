alter table public.requests
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists requests_user_id_idx
on public.requests (user_id);

alter table public.requests
add column if not exists status text default 'pending';

update public.requests
set status = 'pending'
where status is null or status = 'new';

update public.requests
set status = 'cancelled'
where status = 'canceled';

alter table public.reviews
add column if not exists request_id bigint references public.requests(id) on delete set null;

create unique index if not exists reviews_request_id_unique_idx
on public.reviews (request_id)
where request_id is not null;

create index if not exists reviews_request_id_idx
on public.reviews (request_id);
