import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

const reminderRequestSchema = z.object({
  tenant_id: z.string().min(1, 'tenant_id is required'),
  invoice_id: z.string().min(1, 'invoice_id is required'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth client — uses anon key + user's JWT to verify identity
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client — bypasses RLS for DB queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const parsed = reminderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0].message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { tenant_id, invoice_id } = parsed.data;

    // Fetch tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('first_name, last_name, email')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('amount, due_date, invoice_number, payment_token')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch landlord company name
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, first_name, last_name, notification_preferences, bank_name, bank_account_name, bank_account_number, bank_branch')
      .eq('id', user.id)
      .single();

    // Gate on notification preferences — skip if overdue reminders are disabled
    const overduePref = (profile as any)?.notification_preferences?.overdue;
    if (overduePref === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'notifications_disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyName = profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Your Landlord';
    const tenantName = `${tenant.first_name} ${tenant.last_name}`;
    const amountFormatted = `J$${Number(invoice.amount).toLocaleString()}`;

    // Build bank details section if any bank fields are populated
    const hasBankDetails = profile?.bank_name || profile?.bank_account_name || profile?.bank_account_number || profile?.bank_branch;
    let bankDetailsHtml = '';
    if (hasBankDetails) {
      const bankRows: string[] = [];
      if (profile.bank_name) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Bank</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_name}</td></tr>`);
      if (profile.bank_account_name) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account Name</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_account_name}</td></tr>`);
      if (profile.bank_account_number) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Account Number</td><td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${profile.bank_account_number}</td></tr>`);
      if (profile.bank_branch) bankRows.push(`<tr><td style="padding: 12px 16px; color: #6b7280;">Branch / Routing</td><td style="padding: 12px 16px; font-weight: 600; color: #111827;">${profile.bank_branch}</td></tr>`);
      // Remove border-bottom from the last row
      const lastIdx = bankRows.length - 1;
      bankRows[lastIdx] = bankRows[lastIdx].replace(/border-bottom: 1px solid #e5e7eb;/g, '');
      bankDetailsHtml = `
            <p style="color: #374151; font-weight: 600; line-height: 1.6; margin: 24px 0 8px 0;">Payment Details</p>
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px 0; background-color: #f9fafb; border-radius: 8px;">
              ${bankRows.join('\n              ')}
            </table>`;
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EasyCollect <noreply@easycollectja.com>',
        to: tenant.email,
        subject: `Payment Reminder — ${amountFormatted} due`,
        html: buildEmailHtml('Payment Reminder', `
            <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${tenantName},</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">This is a friendly reminder that you have an outstanding payment:</p>
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
            ${invoice.payment_token ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://easycollectja.com'}/pay/${invoice.payment_token}"
                 style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                Pay Now &amp; Upload Proof
              </a>
            </div>` : ''}
            <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">Please make your payment at your earliest convenience.</p>
            <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">— ${companyName}</p>
        `, companyName),
      }),
    });

    if (!emailRes.ok) {
      const errorBody = await emailRes.text();
      console.error('Resend API error:', errorBody);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await emailRes.json();
    return new Response(JSON.stringify({ success: true, email_id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
