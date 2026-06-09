import { supabase } from '@/lib/supabase';

/**
 * JDPA data-subject access right: assemble a complete export of the
 * authenticated user's personal data and everything they control. RLS ensures
 * each query only returns rows the user is entitled to, so this is safe to run
 * with the normal client session.
 */
export async function buildDataExport(userId: string) {
  const [
    profile,
    properties,
    units,
    tenants,
    invoices,
    payments,
    paymentProofs,
    borrowers,
    loans,
    loanInstallments,
    loanPayments,
    notifications,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('properties').select('*').eq('landlord_id', userId),
    supabase.from('units').select('*, property:properties!inner(landlord_id)').eq('property.landlord_id', userId),
    supabase.from('tenants').select('*').eq('landlord_id', userId),
    supabase.from('invoices').select('*').eq('landlord_id', userId),
    supabase.from('payments').select('*').eq('landlord_id', userId),
    supabase.from('payment_proofs').select('*').eq('landlord_id', userId),
    supabase.from('borrowers').select('*').eq('landlord_id', userId),
    supabase.from('loans').select('*').eq('landlord_id', userId),
    supabase.from('loan_installments').select('*').eq('landlord_id', userId),
    supabase.from('loan_payments').select('*').eq('landlord_id', userId),
    supabase.from('notifications').select('*').eq('landlord_id', userId),
  ]);

  return {
    export_generated_at: new Date().toISOString(),
    account_id: userId,
    notice:
      'This file contains the personal data EasyCollect holds for your account, ' +
      'exported under your right of access. Some financial records are retained for ' +
      'up to 7 years to comply with the Income Tax Act.',
    profile: profile.data ?? null,
    properties: properties.data ?? [],
    units: units.data ?? [],
    tenants: tenants.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
    payment_proofs: paymentProofs.data ?? [],
    borrowers: borrowers.data ?? [],
    loans: loans.data ?? [],
    loan_installments: loanInstallments.data ?? [],
    loan_payments: loanPayments.data ?? [],
    notifications: notifications.data ?? [],
  };
}

/** Build the export and trigger a JSON file download in the browser. */
export async function downloadDataExport(userId: string) {
  const data = await buildDataExport(userId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `easycollect-data-export-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
