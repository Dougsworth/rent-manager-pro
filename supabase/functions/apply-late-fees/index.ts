import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch all late fee settings where auto_apply is true
    const { data: allSettings, error: settingsErr } = await supabase
      .from('late_fee_settings')
      .select('*')
      .eq('auto_apply', true);

    if (settingsErr) {
      console.error('Failed to fetch late fee settings:', settingsErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!allSettings || allSettings.length === 0) {
      return new Response(JSON.stringify({ applied: 0, message: 'No auto-apply settings' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let applied = 0;
    let skipped = 0;

    for (const settings of allSettings) {
      const { landlord_id, fee_type, fee_value, grace_period_days } = settings;

      // Calculate the cutoff date (due_date + grace_period must be before today)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - grace_period_days);
      const cutoff = cutoffDate.toISOString().split('T')[0];

      // 2. Find overdue invoices past grace period where late fee not yet applied
      const { data: invoices, error: invErr } = await supabase
        .from('invoices')
        .select('id, amount')
        .eq('landlord_id', landlord_id)
        .in('status', ['overdue', 'pending'])
        .lt('due_date', cutoff)
        .is('late_fee_amount', null);

      if (invErr) {
        console.error(`Failed to fetch invoices for landlord ${landlord_id}:`, invErr);
        skipped++;
        continue;
      }

      if (!invoices || invoices.length === 0) continue;

      for (const invoice of invoices) {
        const lateFee = fee_type === 'flat'
          ? Math.round(fee_value)
          : Math.round((invoice.amount * fee_value) / 100);

        if (lateFee <= 0) {
          skipped++;
          continue;
        }

        const { error: updateErr } = await supabase
          .from('invoices')
          .update({
            late_fee_amount: lateFee,
            late_fee_applied_at: new Date().toISOString(),
            status: 'overdue',
          })
          .eq('id', invoice.id);

        if (updateErr) {
          console.error(`Failed to apply late fee to invoice ${invoice.id}:`, updateErr);
          skipped++;
        } else {
          applied++;
        }
      }
    }

    return new Response(
      JSON.stringify({ applied, skipped }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Apply late fees error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
