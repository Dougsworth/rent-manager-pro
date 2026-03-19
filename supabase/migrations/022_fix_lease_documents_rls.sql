-- Drop the existing policy and recreate with separate INSERT/SELECT/DELETE
DROP POLICY IF EXISTS "Landlords manage own lease documents" ON public.lease_documents;

CREATE POLICY "Landlords can view own lease documents"
  ON public.lease_documents FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own lease documents"
  ON public.lease_documents FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own lease documents"
  ON public.lease_documents FOR DELETE
  USING (auth.uid() = landlord_id);
