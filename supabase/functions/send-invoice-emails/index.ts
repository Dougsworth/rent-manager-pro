import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { landlord_id, due_date } = await req.json();

    if (!landlord_id || !due_date) {
      return new Response(JSON.stringify({ error: 'landlord_id and due_date required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch landlord profile for company name and bank details
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, company_name, bank_name, bank_account_name, bank_account_number, bank_branch, payment_link')
      .eq('id', landlord_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Landlord not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyName = profile.company_name || `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Your Landlord';

    // Fetch invoices for this landlord with the given due date
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('id, tenant_id, amount, due_date, invoice_number, payment_token, description')
      .eq('landlord_id', landlord_id)
      .eq('due_date', due_date)
      .in('status', ['pending', 'overdue']);

    if (invError || !invoices || invoices.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No matching invoices found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get unique tenant IDs and fetch their details
    const tenantIds = [...new Set(invoices.map((inv: any) => inv.tenant_id))];
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, email')
      .in('id', tenantIds);

    const tenantMap = new Map((tenants ?? []).map((t: any) => [t.id, t]));

    // Build bank details HTML
    let bankDetailsHtml = '';
    if (profile.bank_name || profile.bank_account_name) {
      const rows: string[] = [];
      if (profile.bank_name) rows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Bank</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_name}</td></tr>`);
      if (profile.bank_account_name) rows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account Name</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_account_name}</td></tr>`);
      if (profile.bank_account_number) rows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account #</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_account_number}</td></tr>`);
      if (profile.bank_branch) rows.push(`<tr><td style="padding: 12px 16px; color: #6b7280;">Branch</td><td style="padding: 12px 16px; font-weight: 600; color: #111827;">${profile.bank_branch}</td></tr>`);
      bankDetailsHtml = `
        <p style="color: #374151; font-weight: 600; line-height: 1.6; margin: 24px 0 8px 0;">Payment Details</p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px 0; background-color: #f9fafb; border-radius: 8px;">
          ${rows.join('\n')}
        </table>`;
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://easycollectja.com';
    let sent = 0;
    let failed = 0;

    for (const inv of invoices) {
      const tenant = tenantMap.get(inv.tenant_id);
      if (!tenant || !tenant.email) {
        failed++;
        continue;
      }

      const tenantName = `${tenant.first_name} ${tenant.last_name}`;
      const amountFormatted = `J$${Number(inv.amount).toLocaleString()}`;

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'EasyCollect <noreply@easycollectja.com>',
            to: tenant.email,
            subject: `New Invoice — ${amountFormatted} due ${inv.due_date}`,
            html: buildEmailHtml('New Invoice', `
              <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${tenantName},</p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">A new invoice has been created for you:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Invoice</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Amount</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${amountFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Due Date</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${inv.due_date}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280;">Description</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${inv.description || 'Monthly Rent'}</td>
                </tr>
              </table>
              ${bankDetailsHtml}
              ${inv.payment_token ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${siteUrl}/pay/${inv.payment_token}"
                   style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                  View Invoice & Pay
                </a>
              </div>` : ''}
              <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">— ${companyName}</p>
            `, companyName),
          }),
        });

        if (emailRes.ok) {
          sent++;
        } else {
          console.error(`Failed to email ${tenant.email}:`, await emailRes.text());
          failed++;
        }
      } catch (emailErr) {
        console.error(`Error emailing ${tenant.email}:`, emailErr);
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: invoices.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-invoice-emails error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
