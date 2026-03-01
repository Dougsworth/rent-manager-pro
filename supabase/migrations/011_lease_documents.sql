-- Lease documents table
create table if not exists public.lease_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  landlord_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  file_url text not null,
  storage_path text not null,
  document_type text not null default 'lease' check (document_type in ('lease', 'addendum', 'other')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.lease_documents enable row level security;

create policy "Landlords manage own lease documents"
  on public.lease_documents
  for all
  using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

-- Storage bucket for lease documents
insert into storage.buckets (id, name, public)
values ('lease-documents', 'lease-documents', true)
on conflict (id) do nothing;

-- Storage policy: landlords can upload to their own folder
create policy "Landlords upload lease documents"
  on storage.objects
  for insert
  with check (
    bucket_id = 'lease-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Landlords read lease documents"
  on storage.objects
  for select
  using (
    bucket_id = 'lease-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Landlords delete lease documents"
  on storage.objects
  for delete
  using (
    bucket_id = 'lease-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
