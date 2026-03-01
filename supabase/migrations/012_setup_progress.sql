-- Add setup progress tracking to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS setup_progress jsonb DEFAULT '{"has_property": false, "has_units": false, "has_tenant": false, "completed_at": null, "dismissed": false}'::jsonb;
