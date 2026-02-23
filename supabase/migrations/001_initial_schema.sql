-- ============================================
-- EasyCollect — Initial Schema
-- ============================================

-- ---------------------
-- 1. Profiles
-- ---------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'landlord' check (role in ('landlord', 'tenant')),
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  company_name text not null default '',
  company_address text not null default '',
  company_city text not null default '',
  company_country text not null default '',
  company_website text not null default '',
  company_tax_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------
-- 2. Properties
-- ---------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------
-- 3. Units
-- ---------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  rent_amount integer not null default 0, -- JMD cents-free integer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------
-- 4. Tenants
-- ---------------------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null, -- nullable until tenant signs up
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  lease_start date,
  lease_end date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------
-- 5. Invoices
-- ---------------------
create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, -- JMD
  due_date date not null,
  issue_date date not null default current_date,
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------
-- 6. Payments
-- ---------------------
create sequence public.payment_number_seq;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text not null unique,
  invoice_id uuid references public.invoices(id) on delete set null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  payment_date date not null default current_date,
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'card', 'cash', 'other')),
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  transaction_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- Triggers
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'landlord')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-generate invoice number  INV-001, INV-002 …
create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  new.invoice_number := 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 3, '0');
  return new;
end;
$$;

create trigger set_invoice_number
  before insert on public.invoices
  for each row execute function public.generate_invoice_number();

-- Auto-generate payment number  PAY-001, PAY-002 …
create or replace function public.generate_payment_number()
returns trigger
language plpgsql
as $$
begin
  new.payment_number := 'PAY-' || lpad(nextval('public.payment_number_seq')::text, 3, '0');
  return new;
end;
$$;

create trigger set_payment_number
  before insert on public.payments
  for each row execute function public.generate_payment_number();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger units_updated_at before update on public.units for each row execute function public.set_updated_at();
create trigger tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
