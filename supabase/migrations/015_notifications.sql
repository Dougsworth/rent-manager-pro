-- Notifications table for in-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'payment_received',
    'payment_overdue',
    'invoice_created',
    'proof_submitted',
    'proof_approved',
    'proof_rejected',
    'tenant_added',
    'lease_expiring',
    'late_fee_applied',
    'system'
  )),
  title text not null,
  message text not null,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookups
create index idx_notifications_landlord on public.notifications(landlord_id, is_read, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Landlords can view own notifications"
  on public.notifications for select
  using (landlord_id = auth.uid());

create policy "Landlords can update own notifications"
  on public.notifications for update
  using (landlord_id = auth.uid());

create policy "Landlords can delete own notifications"
  on public.notifications for delete
  using (landlord_id = auth.uid());

-- Service role can insert (for triggers / edge functions)
create policy "Service can insert notifications"
  on public.notifications for insert
  with check (landlord_id = auth.uid());
