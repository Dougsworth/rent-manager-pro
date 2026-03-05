-- Recurring invoice settings (one row per landlord)
create table if not exists recurring_invoice_settings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references profiles(id) on delete cascade,
  enabled boolean not null default false,
  day_of_month integer not null default 1 check (day_of_month between 1 and 28),
  send_emails boolean not null default true,
  description_template text not null default 'Monthly Rent — {month} {year}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_invoice_settings_landlord_unique unique (landlord_id)
);

-- RLS
alter table recurring_invoice_settings enable row level security;

create policy "Landlords can view own recurring settings"
  on recurring_invoice_settings for select
  using (landlord_id = auth.uid());

create policy "Landlords can insert own recurring settings"
  on recurring_invoice_settings for insert
  with check (landlord_id = auth.uid());

create policy "Landlords can update own recurring settings"
  on recurring_invoice_settings for update
  using (landlord_id = auth.uid());

-- updated_at trigger
create trigger set_recurring_invoice_settings_updated_at
  before update on recurring_invoice_settings
  for each row execute function update_updated_at();

-- Cron: daily at 00:05 UTC — calls the auto-generate-invoices edge function
select cron.schedule(
  'auto-generate-invoices-daily',
  '5 0 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-generate-invoices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
