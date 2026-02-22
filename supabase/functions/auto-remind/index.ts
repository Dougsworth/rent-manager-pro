import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

Deno.serve(async (req) => {
  try {
    // Service client — bypasses RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://easyrentcollect.com';
    const today = new Date().toISOString().split('T')[0];

    // Find all overdue invoices (due_date < today, not paid)
    const { data: overdueInvoices, error: invoiceErr } = await supabase
      .from('invoices')
      .select('id, tenant_id, landlord_id, amount, due_date, invoice_number, payment_token')
      .lt('due_date', today)
      .neq('status', 'paid');

    if (invoiceErr) {
      console.error('Failed to fetch overdue invoices:', invoiceErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch invoices' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No overdue invoices' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark overdue invoices that are still 'pending'
    const overdueIds = overdueInvoices
      .filter((i: any) => i.status !== 'overdue')
      .map((i: any) => i.id);

    if (overdueIds.length > 0) {
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .in('id', overdueIds);
    }

    // Skip invoices that already have a pending proof (tenant already submitted)
    const invoiceIds = overdueInvoices.map((i: any) => i.id);
    const { data: pendingProofs } = await supabase
      .from('payment_proofs')
      .select('invoice_id')
      .in('invoice_id', invoiceIds)
      .eq('status', 'pending');

    const pendingInvoiceIds = new Set((pendingProofs ?? []).map((p: any) => p.invoice_id));

    // Filter out invoices with pending proofs
    const invoicesToRemind = overdueInvoices.filter(
      (i: any) => !pendingInvoiceIds.has(i.id)
    );

    // Group by landlord to check notification preferences once per landlord
    const landlordIds = [...new Set(invoicesToRemind.map((i: any) => i.landlord_id))];

    // Fetch landlord profiles
    const { data: landlordProfiles } = await supabase
      .from('profiles')
      .select('id, company_name, first_name, last_name, notification_preferences, bank_name, bank_account_name, bank_account_number, bank_branch')
      .in('id', landlordIds);

    const landlordMap = new Map(
      (landlordProfiles ?? []).map((p: any) => [p.id, p])
    );

    // Fetch all relevant tenants
    const tenantIds = [...new Set(invoicesToRemind.map((i: any) => i.tenant_id))];
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, email')
      .in('id', tenantIds);

    const tenantMap = new Map(
      (tenants ?? []).map((t: any) => [t.id, t])
    );

    let sent = 0;
    let skipped = 0;

    for (const invoice of invoicesToRemind) {
      const landlord = landlordMap.get(invoice.landlord_id);
      const tenant = tenantMap.get(invoice.tenant_id);

      if (!landlord || !tenant || !tenant.email) {
        skipped++;
        continue;
      }

      // Respect notification preferences — skip if auto_remind is not enabled
      const autoRemindPref = landlord.notification_preferences?.auto_remind;
      if (autoRemindPref !== true) {
        skipped++;
        continue;
      }

      const companyName = landlord.company_name ||
        `${landlord.first_name ?? ''} ${landlord.last_name ?? ''}`.trim() ||
        'Your Landlord';
      const tenantName = `${tenant.first_name} ${tenant.last_name}`;
      const amountFormatted = `J$${Number(invoice.amount).toLocaleString()}`;

      // Build bank details
      const hasBankDetails = landlord.bank_name || landlord.bank_account_name || landlord.bank_account_number || landlord.bank_branch;
      let bankDetailsHtml = '';
      if (hasBankDetails) {
        const bankRows: string[] = [];
        if (landlord.bank_name) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Bank</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${landlord.bank_name}</td></tr>`);
        if (landlord.bank_account_name) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account Name</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${landlord.bank_account_name}</td></tr>`);
        if (landlord.bank_account_number) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account Number</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${landlord.bank_account_number}</td></tr>`);
        if (landlord.bank_branch) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280;">Branch</td><td style="padding: 12px 16px; font-weight: 600; color: #111827;">${landlord.bank_branch}</td></tr>`);
        const lastIdx = bankRows.length - 1;
        bankRows[lastIdx] = bankRows[lastIdx].replace(/border-bottom: 1px solid #e5e7eb;/g, '');
        bankDetailsHtml = `
          <p style="color: #374151; font-weight: 600; line-height: 1.6; margin: 24px 0 8px 0;">Payment Details</p>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px 0; background-color: #f9fafb; border-radius: 8px;">
            ${bankRows.join('\n            ')}
          </table>`;
      }

      const payButtonHtml = invoice.payment_token ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${siteUrl}/pay/${invoice.payment_token}"
             style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Pay Now &amp; Upload Proof
          </a>
        </div>` : '';

      const emailHtml = buildEmailHtml('Payment Reminder', `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${tenantName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">This is a friendly reminder that you have an overdue payment:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 8px;">
          <tr>
            <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Invoice</td>
            <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Amount Due</td>
            <td style="padding: 12px 16px; font-weight: 600; color: #dc2626; border-bottom: 1px solid #e5e7eb;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #6b7280;">Due Date</td>
            <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${invoice.due_date}</td>
          </tr>
        </table>
        ${bankDetailsHtml}
        ${payButtonHtml}
        <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">Please make your payment at your earliest convenience.</p>
        <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">— ${companyName}</p>
      `, companyName);

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'EasyRentCollect <onboarding@resend.dev>',
            to: tenant.email,
            subject: `Payment Overdue — ${amountFormatted} due`,
            html: emailHtml,
          }),
        });

        if (emailRes.ok) {
          sent++;
        } else {
          const errBody = await emailRes.text();
          console.error(`Failed to send to ${tenant.email}:`, errBody);
          skipped++;
        }
      } catch (emailErr) {
        console.error(`Email send error for ${tenant.email}:`, emailErr);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ sent, skipped, total: invoicesToRemind.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Auto-remind error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
