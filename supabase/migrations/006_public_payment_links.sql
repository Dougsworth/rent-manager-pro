-- Add payment_token column to invoices
alter table public.invoices
  add column payment_token uuid not null default gen_random_uuid();

create unique index invoices_payment_token_idx on public.invoices (payment_token);

-- RPC: get invoice details by public token (SECURITY DEFINER bypasses RLS)
create or replace function public.get_invoice_by_token(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'invoice_id', i.id,
    'invoice_number', i.invoice_number,
    'amount', i.amount,
    'due_date', i.due_date,
    'issue_date', i.issue_date,
    'status', i.status,
    'description', i.description,
    'tenant_name', t.first_name || ' ' || t.last_name,
    'bank_name', p.bank_name,
    'bank_account_name', p.bank_account_name,
    'bank_account_number', p.bank_account_number,
    'bank_branch', p.bank_branch,
    'proofs', coalesce((
      select json_agg(json_build_object(
        'id', pp.id,
        'image_url', pp.image_url,
        'status', pp.status,
        'reviewer_note', pp.reviewer_note,
        'created_at', pp.created_at
      ) order by pp.created_at desc)
      from public.payment_proofs pp
      where pp.invoice_id = i.id
    ), '[]'::json)
  ) into result
  from public.invoices i
  join public.tenants t on t.id = i.tenant_id
  join public.profiles p on p.id = i.landlord_id
  where i.payment_token = p_token;

  return result;
end;
$$;

-- RPC: submit payment proof by public token (SECURITY DEFINER bypasses RLS)
create or replace function public.submit_proof_by_token(p_token uuid, p_image_url text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_proof record;
begin
  select i.id, i.status, i.tenant_id, i.landlord_id
  into v_invoice
  from public.invoices i
  where i.payment_token = p_token;

  if not found then
    raise exception 'Invalid payment token';
  end if;

  if v_invoice.status = 'paid' then
    raise exception 'Invoice is already paid';
  end if;

  -- Reject if there is already a pending proof
  if exists (
    select 1 from public.payment_proofs
    where invoice_id = v_invoice.id and status = 'pending'
  ) then
    raise exception 'A proof is already pending review';
  end if;

  insert into public.payment_proofs (invoice_id, tenant_id, landlord_id, image_url)
  values (v_invoice.id, v_invoice.tenant_id, v_invoice.landlord_id, p_image_url)
  returning * into v_proof;

  return json_build_object('id', v_proof.id, 'status', v_proof.status);
end;
$$;

-- Grant anon access to RPCs
grant execute on function public.get_invoice_by_token(uuid) to anon;
grant execute on function public.submit_proof_by_token(uuid, text) to anon;

-- Allow anon uploads to payment-proofs bucket scoped to public/ folder
create policy "Anon can upload to public folder"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = 'public'
  );
