-- ============================================
-- JDPA — Soft delete for data-subject person records
-- ============================================
-- The JDPA requires a documented deletion policy. We soft-delete tenants and
-- borrowers (the PII-bearing "data subject" tables) so that:
--   1. The record disappears from the landlord's active views immediately.
--   2. Linked financial records (invoices/payments/loans) survive for the
--      7-year retention window required by the Income Tax Act.
--   3. The data-retention cron (migration 028) anonymizes the PII once the
--      retention window for the person has elapsed.

alter table public.tenants
  add column if not exists deleted_at timestamptz;

alter table public.borrowers
  add column if not exists deleted_at timestamptz;

-- Partial indexes keep the common "active records only" reads fast.
create index if not exists tenants_active_idx
  on public.tenants (landlord_id)
  where deleted_at is null;

create index if not exists borrowers_active_idx
  on public.borrowers (landlord_id)
  where deleted_at is null;
