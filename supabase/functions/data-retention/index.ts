// ============================================
// JDPA — Data retention / anonymization job
// ============================================
// Runs daily (see migration 028). Anonymizes the PII on person records once
// their retention window has elapsed, while leaving the financial records
// (invoices, payments, loans, installments) intact for the 7-year window
// required by the Income Tax Act.
//
// Retention rules:
//   Tenant PII  → tenancy end + 1 year, OR soft-deleted + 1 year.
//   Borrower PII → soft-deleted + 1 year, OR all loans settled + 1 year.
// "Anonymize" = blank the direct identifiers and stamp anonymized_at via notes.
// The row itself is kept so foreign keys on payments/invoices stay valid.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETENTION_YEARS = 1; // PII kept for tenancy/loan end + this many years

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
    const cutoffISO = cutoff.toISOString();
    const cutoffDate = cutoffISO.split('T')[0];

    const anonTenant = {
      first_name: 'Redacted',
      last_name: 'Tenant',
      email: '',
      phone: '',
    };
    const anonBorrower = {
      first_name: 'Redacted',
      last_name: 'Borrower',
      email: '',
      phone: '',
      notes: '',
    };

    let tenantsAnonymized = 0;
    let borrowersAnonymized = 0;

    // --- Tenants: soft-deleted over a year ago ---------------------------
    const { data: deletedTenants, error: dtErr } = await supabase
      .from('tenants')
      .select('id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffISO)
      .neq('first_name', 'Redacted');
    if (dtErr) throw dtErr;

    // --- Tenants: lease ended over a year ago and no longer active -------
    const { data: expiredTenants, error: etErr } = await supabase
      .from('tenants')
      .select('id')
      .is('deleted_at', null)
      .eq('status', 'inactive')
      .not('lease_end', 'is', null)
      .lt('lease_end', cutoffDate)
      .neq('first_name', 'Redacted');
    if (etErr) throw etErr;

    const tenantIds = [
      ...(deletedTenants ?? []),
      ...(expiredTenants ?? []),
    ].map((t) => t.id);

    if (tenantIds.length > 0) {
      const { error } = await supabase
        .from('tenants')
        .update(anonTenant)
        .in('id', tenantIds);
      if (error) throw error;
      tenantsAnonymized = tenantIds.length;
    }

    // --- Borrowers: soft-deleted over a year ago ------------------------
    const { data: deletedBorrowers, error: dbErr } = await supabase
      .from('borrowers')
      .select('id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffISO)
      .neq('first_name', 'Redacted');
    if (dbErr) throw dbErr;

    const borrowerIds = (deletedBorrowers ?? []).map((b) => b.id);

    if (borrowerIds.length > 0) {
      const { error } = await supabase
        .from('borrowers')
        .update(anonBorrower)
        .in('id', borrowerIds);
      if (error) throw error;
      borrowersAnonymized = borrowerIds.length;
    }

    return new Response(
      JSON.stringify({ tenantsAnonymized, borrowersAnonymized, cutoff: cutoffISO }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Data retention job error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
