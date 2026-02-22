-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

-- ---------------------
-- Profiles
-- ---------------------
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------
-- Properties
-- ---------------------
create policy "Landlords can view own properties"
  on public.properties for select
  using (auth.uid() = landlord_id);

create policy "Landlords can insert own properties"
  on public.properties for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update own properties"
  on public.properties for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete own properties"
  on public.properties for delete
  using (auth.uid() = landlord_id);

-- ---------------------
-- Units
-- ---------------------
create policy "Landlords can view units of own properties"
  on public.units for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
        and properties.landlord_id = auth.uid()
    )
  );

create policy "Landlords can insert units to own properties"
  on public.units for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
        and properties.landlord_id = auth.uid()
    )
  );

create policy "Landlords can update units of own properties"
  on public.units for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
        and properties.landlord_id = auth.uid()
    )
  );

create policy "Landlords can delete units of own properties"
  on public.units for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
        and properties.landlord_id = auth.uid()
    )
  );

-- ---------------------
-- Tenants
-- ---------------------
create policy "Landlords can view own tenants"
  on public.tenants for select
  using (auth.uid() = landlord_id);

create policy "Tenants can view own record"
  on public.tenants for select
  using (auth.uid() = profile_id);

create policy "Landlords can insert tenants"
  on public.tenants for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update own tenants"
  on public.tenants for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete own tenants"
  on public.tenants for delete
  using (auth.uid() = landlord_id);

-- ---------------------
-- Invoices
-- ---------------------
create policy "Landlords can view own invoices"
  on public.invoices for select
  using (auth.uid() = landlord_id);

create policy "Tenants can view own invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.id = invoices.tenant_id
        and tenants.profile_id = auth.uid()
    )
  );

create policy "Landlords can insert invoices"
  on public.invoices for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update own invoices"
  on public.invoices for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete own invoices"
  on public.invoices for delete
  using (auth.uid() = landlord_id);

-- ---------------------
-- Payments
-- ---------------------
create policy "Landlords can view own payments"
  on public.payments for select
  using (auth.uid() = landlord_id);

create policy "Tenants can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.id = payments.tenant_id
        and tenants.profile_id = auth.uid()
    )
  );

create policy "Landlords can insert payments"
  on public.payments for insert
  with check (auth.uid() = landlord_id);

create policy "Tenants can insert payments for own invoices"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.tenants
      where tenants.id = payments.tenant_id
        and tenants.profile_id = auth.uid()
    )
  );

create policy "Landlords can update own payments"
  on public.payments for update
  using (auth.uid() = landlord_id);
