-- Ensure storage buckets exist (idempotent)
-- Fixes "bucket not found" error for lease document uploads

insert into storage.buckets (id, name, public)
values ('lease-documents', 'lease-documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Ensure public read access for payment-proofs (may already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Public read payment proofs' and tablename = 'objects'
  ) then
    create policy "Public read payment proofs"
      on storage.objects for select
      using (bucket_id = 'payment-proofs');
  end if;
end
$$;

-- Ensure public read for lease-documents
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Public read lease documents' and tablename = 'objects'
  ) then
    create policy "Public read lease documents"
      on storage.objects for select
      using (bucket_id = 'lease-documents');
  end if;
end
$$;
