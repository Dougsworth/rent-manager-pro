import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = new Date();
    const todayDay = now.getUTCDate();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthLabel = monthNames[currentMonth];

    // 1. Fetch enabled settings where day_of_month matches today
    const { data: allSettings, error: settingsErr } = await supabase
      .from('recurring_invoice_settings')
      .select('*')
      .eq('enabled', true)
      .eq('day_of_month', todayDay);

    if (settingsErr) {
      console.error('Failed to fetch recurring invoice settings:', settingsErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!allSettings || allSettings.length === 0) {
      return new Response(
        JSON.stringify({ generated: 0, skipped: 0, landlords_processed: 0, message: 'No matching settings for today' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let totalGenerated = 0;
    let totalSkipped = 0;
    let landlordsProcessed = 0;

    // Due date is 1st of current month
    const dueDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    // Month range for deduplication
    const monthStartStr = dueDateStr;
    const nextMonth = currentMonth === 11
      ? new Date(currentYear + 1, 0, 1)
      : new Date(currentYear, currentMonth + 1, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

    for (const settings of allSettings) {
      const { landlord_id, send_emails, description_template } = settings;
      landlordsProcessed++;

      // 2. Fetch active tenants with unit assigned and rent > 0
      const { data: tenants, error: tenantErr } = await supabase
        .from('tenants')
        .select('id, first_name, last_name, email, unit_id, unit:units(rent_amount)')
        .eq('landlord_id', landlord_id)
        .eq('status', 'active')
        .not('unit_id', 'is', null);

      if (tenantErr) {
        console.error(`Failed to fetch tenants for landlord ${landlord_id}:`, tenantErr);
        continue;
      }

      if (!tenants || tenants.length === 0) continue;

      const description = (description_template || 'Monthly Rent — {month} {year}')
        .replace('{month}', monthLabel)
        .replace('{year}', String(currentYear));

      let landlordGenerated = 0;

      // Fetch landlord bank details for emails
      let bankDetails: any = null;
      if (send_emails) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name, bank_name, bank_account_name, bank_account_number, bank_branch, payment_link')
          .eq('id', landlord_id)
          .single();
        bankDetails = profile;
      }

      for (const tenant of tenants) {
        const rentAmount = (tenant as any).unit?.rent_amount ?? 0;
        if (rentAmount <= 0) {
          totalSkipped++;
          continue;
        }

        // 3. Deduplicate: skip if tenant already has pending/overdue invoice for the month
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('landlord_id', landlord_id)
          .eq('tenant_id', tenant.id)
          .in('status', ['pending', 'overdue'])
          .gte('due_date', monthStartStr)
          .lt('due_date', nextMonthStr)
          .limit(1);

        if (existing && existing.length > 0) {
          totalSkipped++;
          continue;
        }

        // 4. Insert invoice
        const { data: invoice, error: insertErr } = await supabase
          .from('invoices')
          .insert({
            tenant_id: tenant.id,
            landlord_id,
            amount: rentAmount,
            due_date: dueDateStr,
            description,
            invoice_number: 'TEMP',
          })
          .select('id, invoice_number, payment_token')
          .single();

        if (insertErr) {
          console.error(`Failed to create invoice for tenant ${tenant.id}:`, insertErr);
          totalSkipped++;
          continue;
        }

        totalGenerated++;
        landlordGenerated++;

        // 5. Send email if enabled
        if (send_emails && tenant.email && bankDetails) {
          try {
            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
            const SITE_URL = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || '';

            if (RESEND_API_KEY) {
              const payLink = invoice.payment_token
                ? `${SITE_URL}/pay/${invoice.payment_token}`
                : '';

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: 'EasyCollect <noreply@easycollect.app>',
                  to: [tenant.email],
                  subject: `Invoice: ${description} — J$${rentAmount.toLocaleString()}`,
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2>New Invoice</h2>
                      <p>Hi ${tenant.first_name},</p>
                      <p>A new invoice has been generated for your rent:</p>
                      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice #</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoice_number}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">J$${rentAmount.toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dueDateStr}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description}</td></tr>
                      </table>
                      ${bankDetails.bank_name ? `
                        <h3>Bank Details</h3>
                        <p><strong>Bank:</strong> ${bankDetails.bank_name}<br/>
                        <strong>Account Name:</strong> ${bankDetails.bank_account_name}<br/>
                        <strong>Account #:</strong> ${bankDetails.bank_account_number}<br/>
                        <strong>Branch:</strong> ${bankDetails.bank_branch}</p>
                      ` : ''}
                      ${payLink ? `<p><a href="${payLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">View Invoice & Pay</a></p>` : ''}
                      <p style="color: #666; font-size: 14px;">— ${bankDetails.company_name || `${bankDetails.first_name} ${bankDetails.last_name}`}</p>
                    </div>
                  `,
                }),
              });
            }
          } catch (emailErr) {
            console.error(`Failed to send invoice email to ${tenant.email}:`, emailErr);
          }
        }
      }

      // 6. Create notification for landlord
      if (landlordGenerated > 0) {
        await supabase.from('notifications').insert({
          landlord_id,
          type: 'invoice_created',
          title: 'Recurring Invoices Generated',
          message: `${landlordGenerated} invoice${landlordGenerated === 1 ? '' : 's'} auto-generated for ${monthLabel} ${currentYear}.`,
        });
      }
    }

    return new Response(
      JSON.stringify({ generated: totalGenerated, skipped: totalSkipped, landlords_processed: landlordsProcessed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Auto-generate invoices error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
