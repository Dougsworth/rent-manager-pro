-- Activity log table for audit trail (immutable — no UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'invoice_created', 'invoice_bulk_created', 'invoice_updated',
    'payment_created',
    'tenant_added', 'tenant_updated', 'tenant_deleted',
    'proof_submitted', 'proof_approved', 'proof_rejected',
    'property_created', 'property_updated', 'property_deleted',
    'unit_created', 'unit_updated', 'unit_deleted'
  )),
  entity_type text NOT NULL CHECK (entity_type IN (
    'invoice', 'payment', 'tenant', 'property', 'unit', 'proof', 'settings'
  )),
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast landlord-scoped queries ordered by time
CREATE INDEX idx_activity_logs_landlord_time ON activity_logs (landlord_id, created_at DESC);

-- RLS: landlord can SELECT + INSERT own rows only, no UPDATE/DELETE
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);
