-- Schedule the JDPA data-retention/anonymization job.
-- Runs weekly on Sunday at 03:00 UTC — well clear of the daily 06:xx invoice,
-- lease and loan cron window. Anonymizes tenant/borrower PII whose retention
-- window has elapsed (see supabase/functions/data-retention).
select cron.schedule(
  'data-retention-weekly',
  '0 3 * * 0',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/data-retention',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
