ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb
DEFAULT '{"payments": true, "overdue": true, "invoices": true}'::jsonb;
