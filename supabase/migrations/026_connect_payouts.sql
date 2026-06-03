-- ============================================
-- Stripe Connect payouts — route each landlord's payments to their own account
-- ============================================
alter table public.profiles
  add column if not exists connected_account_id text,
  add column if not exists payouts_enabled boolean not null default false;

comment on column public.profiles.connected_account_id is
  'LuniPay/Stripe Connect connected account id (acct_...) that tenant payments are routed to.';
comment on column public.profiles.payouts_enabled is
  'True once the connected account has completed onboarding and can receive payouts.';
