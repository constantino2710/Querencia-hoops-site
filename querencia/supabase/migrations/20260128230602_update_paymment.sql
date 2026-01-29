alter table public.payments
add column if not exists order_id text;

alter table public.payments
add column if not exists charge_id text;

alter table public.payments
add column if not exists amount int;

alter table public.payments
add column if not exists status text;

alter table public.payments
add column if not exists payment_method text;

alter table public.payments
add column if not exists metadata jsonb;

create unique index if not exists payments_order_id_unique
on public.payments(order_id);
