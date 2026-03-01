-- Late fee settings (one config per landlord)
create table if not exists public.late_fee_settings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references auth.users(id) on delete cascade,
  fee_type text not null default 'flat' check (fee_type in ('flat', 'percentage')),
  fee_value numeric not null default 0,
  grace_period_days integer not null default 0,
  auto_apply boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (landlord_id)
);

-- RLS
alter table public.late_fee_settings enable row level security;

create policy "Landlords manage own late fee settings"
  on public.late_fee_settings
  for all
  using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

-- Add late fee columns to invoices
alter table public.invoices
  add column if not exists late_fee_amount integer,
  add column if not exists late_fee_applied_at timestamptz;
