-- Replace global sequence with per-tenant invoice numbering
-- e.g. INV-ARB-001 for Arii b's first invoice (first 2 of first name + first of last)
create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
  v_tag text;
begin
  -- Build a 3-letter tag: first 2 of first_name + first 1 of last_name
  select upper(left(first_name, 2)) || upper(left(last_name, 1))
  into v_tag
  from public.tenants
  where id = new.tenant_id;

  v_tag := coalesce(nullif(v_tag, ''), 'XXX');

  -- Count existing invoices for this tenant
  select count(*) + 1
  into next_num
  from public.invoices
  where tenant_id = new.tenant_id;

  new.invoice_number := 'INV-' || v_tag || '-' || lpad(next_num::text, 3, '0');
  return new;
end;
$$;

-- Drop the global unique constraint so different tenants can share numbers
alter table public.invoices drop constraint if exists invoices_invoice_number_key;

-- Add a unique constraint per tenant instead
create unique index if not exists invoices_tenant_invoice_number_idx
  on public.invoices (tenant_id, invoice_number);
