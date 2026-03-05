-- Fix payment_proofs foreign keys to cascade on delete
-- Without this, deleting a tenant or invoice fails because payment_proofs blocks it

alter table public.payment_proofs
  drop constraint payment_proofs_invoice_id_fkey,
  add constraint payment_proofs_invoice_id_fkey
    foreign key (invoice_id) references public.invoices(id) on delete cascade;

alter table public.payment_proofs
  drop constraint payment_proofs_tenant_id_fkey,
  add constraint payment_proofs_tenant_id_fkey
    foreign key (tenant_id) references public.tenants(id) on delete cascade;

alter table public.payment_proofs
  drop constraint payment_proofs_landlord_id_fkey,
  add constraint payment_proofs_landlord_id_fkey
    foreign key (landlord_id) references public.profiles(id) on delete cascade;
