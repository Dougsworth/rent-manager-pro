-- Add payment_link column to profiles for HandyPay integration
alter table public.profiles add column payment_link text;

-- Recreate get_invoice_by_token to include payment_link
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
    'payment_link', p.payment_link,
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
