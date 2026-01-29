alter table public.payments
add column if not exists order_id text;

create unique index if not exists payments_order_id_unique
on public.payments(order_id);
