-- Enable extensions needed for cron scheduling
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- NOTE: The cron job itself should be set up via the Supabase Dashboard:
-- Go to Project Settings > Integrations > Cron Jobs > Create
-- Schedule: 0 8 * * *  (daily at 8am UTC)
-- Command: select net.http_post(
--   url := 'https://kshouecmnfucctcgqcte.supabase.co/functions/v1/auto-remind',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{}'::jsonb
-- );
