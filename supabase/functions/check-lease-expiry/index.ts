import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const in30Str = in30Days.toISOString().split('T')[0];

    // Find active tenants whose lease ends within 30 days
    const { data: tenants, error: tenErr } = await supabase
      .from('tenants')
      .select('id, landlord_id, first_name, last_name, lease_end')
      .eq('status', 'active')
      .not('lease_end', 'is', null)
      .gte('lease_end', todayStr)
      .lte('lease_end', in30Str);

    if (tenErr) {
      console.error('Failed to fetch tenants with expiring leases:', tenErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch tenants' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!tenants || tenants.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let notified = 0;

    for (const tenant of tenants) {
      const daysLeft = Math.ceil(
        (new Date(tenant.lease_end).getTime() - today.getTime()) / 86400000,
      );

      // Only notify at 30, 14, 7, 3, and 1 day marks to avoid spam
      if (![30, 14, 7, 3, 1].includes(daysLeft)) continue;

      // Check if we already sent this exact notification today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('landlord_id', tenant.landlord_id)
        .eq('type', 'lease_expiring')
        .eq('related_entity_id', tenant.id)
        .gte('created_at', todayStr)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const name = `${tenant.first_name} ${tenant.last_name}`;
      await supabase.from('notifications').insert({
        landlord_id: tenant.landlord_id,
        type: 'lease_expiring',
        title: 'Lease Expiring Soon',
        message: `${name}'s lease expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${tenant.lease_end})`,
        related_entity_id: tenant.id,
      });
      notified++;
    }

    return new Response(
      JSON.stringify({ notified }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Check lease expiry error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
