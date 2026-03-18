import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date().toISOString().split('T')[0];

    // Find invoices that are pending but past due date
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('id, landlord_id, amount, due_date, tenant_id')
      .eq('status', 'pending')
      .lt('due_date', today);

    if (invErr) {
      console.error('Failed to fetch pending invoices:', invErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch invoices' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!invoices || invoices.length === 0) {
      return new Response(JSON.stringify({ marked: 0, notified: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let marked = 0;
    let notified = 0;

    // Group by landlord to batch notifications
    const byLandlord = new Map<string, typeof invoices>();
    for (const inv of invoices) {
      const list = byLandlord.get(inv.landlord_id) ?? [];
      list.push(inv);
      byLandlord.set(inv.landlord_id, list);
    }

    for (const [landlordId, landlordInvoices] of byLandlord) {
      // Mark all as overdue
      const ids = landlordInvoices.map((i) => i.id);
      const { error: updateErr } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .in('id', ids);

      if (updateErr) {
        console.error(`Failed to mark invoices overdue for landlord ${landlordId}:`, updateErr);
        continue;
      }

      marked += ids.length;

      // Fetch tenant names for the notification message
      const tenantIds = [...new Set(landlordInvoices.map((i) => i.tenant_id))];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, first_name, last_name')
        .in('id', tenantIds);

      const tenantMap = new Map(
        (tenants ?? []).map((t: any) => [t.id, `${t.first_name} ${t.last_name}`]),
      );

      // Create one notification per overdue invoice
      for (const inv of landlordInvoices) {
        const tenantName = tenantMap.get(inv.tenant_id) ?? 'A tenant';
        const daysOverdue = Math.floor(
          (new Date(today).getTime() - new Date(inv.due_date).getTime()) / 86400000,
        );

        await supabase.from('notifications').insert({
          landlord_id: landlordId,
          type: 'payment_overdue',
          title: 'Payment Overdue',
          message: `${tenantName}'s payment of J$${Number(inv.amount).toLocaleString()} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          related_entity_id: inv.id,
        });
        notified++;
      }
    }

    return new Response(
      JSON.stringify({ marked, notified }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Check overdue error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
