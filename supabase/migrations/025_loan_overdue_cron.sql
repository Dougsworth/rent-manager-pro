-- Schedule daily loan overdue check at 6:45 AM UTC (after invoice overdue at 6:15
-- and lease expiry at 6:30). Flips past-due loan installments pending → overdue
-- and creates 'loan_overdue' notifications for the landlord.
select cron.schedule(
  'check-loan-overdue-daily',
  '45 6 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-loan-overdue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
