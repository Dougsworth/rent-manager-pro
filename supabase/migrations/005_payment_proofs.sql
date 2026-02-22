-- Payment proofs table
create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  tenant_id uuid not null references public.tenants(id),
  landlord_id uuid not null references public.profiles(id),
  image_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger
create trigger set_payment_proofs_updated_at
  before update on public.payment_proofs
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.payment_proofs enable row level security;

-- Landlords can view proofs for their properties
create policy "Landlords can view own proofs"
  on public.payment_proofs for select
  using (landlord_id = auth.uid());

-- Tenants can view their own proofs
create policy "Tenants can view own proofs"
  on public.payment_proofs for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.id = payment_proofs.tenant_id
        and tenants.profile_id = auth.uid()
    )
  );

-- Tenants can insert proofs for their own invoices
create policy "Tenants can insert own proofs"
  on public.payment_proofs for insert
  with check (
    exists (
      select 1 from public.tenants
      where tenants.id = payment_proofs.tenant_id
        and tenants.profile_id = auth.uid()
    )
  );

-- Landlords can update (approve/reject) their own proofs
create policy "Landlords can update own proofs"
  on public.payment_proofs for update
  using (landlord_id = auth.uid());

-- Storage bucket for proof images
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to payment-proofs bucket
create policy "Authenticated users can upload payment proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');

-- Allow public read access to payment proof images
create policy "Public read access for payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');
