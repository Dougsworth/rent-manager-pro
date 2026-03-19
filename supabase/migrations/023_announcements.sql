-- System announcements (admin-managed via SQL)
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT 'sparkles', -- sparkles | party | megaphone | info
  cta_text text,        -- button text (optional)
  cta_link text,        -- button link (optional)
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz -- auto-hide after this date (optional)
);

-- Track which users dismissed which announcement
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read announcements
CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own dismissals
CREATE POLICY "Users can dismiss announcements"
  ON announcement_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own dismissals
CREATE POLICY "Users can read own dismissals"
  ON announcement_dismissals FOR SELECT
  USING (auth.uid() = user_id);
