-- ============================================
-- EasyCollect — Loan Tracking
-- ============================================

-- ---------------------
-- 1. Borrowers
-- ---------------------
CREATE TABLE public.borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------
-- 2. Loans
-- ---------------------
CREATE SEQUENCE IF NOT EXISTS public.loan_number_seq START 1;

CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number text NOT NULL UNIQUE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES public.borrowers(id) ON DELETE CASCADE,
  principal integer NOT NULL,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  term_months integer NOT NULL,
  monthly_installment integer NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  total_paid integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------
-- 3. Loan Installments
-- ---------------------
CREATE TABLE public.loan_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount integer NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------
-- 4. Loan Payments
-- ---------------------
CREATE SEQUENCE IF NOT EXISTS public.loan_payment_number_seq START 1;

CREATE TABLE public.loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text NOT NULL UNIQUE,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_id uuid REFERENCES public.loan_installments(id) ON DELETE SET NULL,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'card', 'cash', 'other')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Triggers
-- ============================================

-- Auto-generate loan number LN-001, LN-002 …
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.loan_number := 'LN-' || lpad(nextval('public.loan_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_loan_number
  BEFORE INSERT ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.generate_loan_number();

-- Auto-generate loan payment number LP-001, LP-002 …
CREATE OR REPLACE FUNCTION public.generate_loan_payment_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.payment_number := 'LP-' || lpad(nextval('public.loan_payment_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_loan_payment_number
  BEFORE INSERT ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_loan_payment_number();

-- Updated_at triggers
CREATE TRIGGER borrowers_updated_at BEFORE UPDATE ON public.borrowers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loan_installments_updated_at BEFORE UPDATE ON public.loan_installments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loan_payments_updated_at BEFORE UPDATE ON public.loan_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_borrowers_landlord ON public.borrowers (landlord_id);
CREATE INDEX idx_loans_landlord ON public.loans (landlord_id, status);
CREATE INDEX idx_loan_installments_loan ON public.loan_installments (loan_id, due_date);
CREATE INDEX idx_loan_installments_landlord ON public.loan_installments (landlord_id, status, due_date);
CREATE INDEX idx_loan_payments_landlord ON public.loan_payments (landlord_id, payment_date DESC);

-- ============================================
-- RLS Policies
-- ============================================

-- Borrowers
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own borrowers"
  ON public.borrowers FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert own borrowers"
  ON public.borrowers FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own borrowers"
  ON public.borrowers FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own borrowers"
  ON public.borrowers FOR DELETE USING (auth.uid() = landlord_id);

-- Loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own loans"
  ON public.loans FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert own loans"
  ON public.loans FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own loans"
  ON public.loans FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own loans"
  ON public.loans FOR DELETE USING (auth.uid() = landlord_id);

-- Loan Installments
ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own loan installments"
  ON public.loan_installments FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert own loan installments"
  ON public.loan_installments FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own loan installments"
  ON public.loan_installments FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own loan installments"
  ON public.loan_installments FOR DELETE USING (auth.uid() = landlord_id);

-- Loan Payments
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own loan payments"
  ON public.loan_payments FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert own loan payments"
  ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own loan payments"
  ON public.loan_payments FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own loan payments"
  ON public.loan_payments FOR DELETE USING (auth.uid() = landlord_id);

-- ============================================
-- Extend activity_logs and notifications
-- ============================================

-- Add loan actions to activity_logs
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_check;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_action_check CHECK (action IN (
  'invoice_created', 'invoice_bulk_created', 'invoice_updated',
  'payment_created',
  'tenant_added', 'tenant_updated', 'tenant_deleted',
  'proof_submitted', 'proof_approved', 'proof_rejected',
  'property_created', 'property_updated', 'property_deleted',
  'unit_created', 'unit_updated', 'unit_deleted',
  'loan_created', 'loan_updated', 'loan_payment_created',
  'borrower_added', 'borrower_updated', 'borrower_deleted'
));

-- Add loan entity types
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_entity_type_check CHECK (entity_type IN (
  'invoice', 'payment', 'tenant', 'property', 'unit', 'proof', 'settings',
  'loan', 'borrower', 'loan_payment'
));

-- Add loan notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'payment_received', 'payment_overdue', 'invoice_created',
  'proof_submitted', 'proof_approved', 'proof_rejected',
  'tenant_added', 'lease_expiring', 'late_fee_applied', 'system',
  'loan_payment_received', 'loan_overdue'
));
