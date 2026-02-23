import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

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

    // Auth client — verify caller identity
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

    // Service client — bypasses RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { payment_id, tenant_id, invoice_id } = await req.json();
    if (!payment_id || !tenant_id || !invoice_id) {
      return new Response(JSON.stringify({ error: 'payment_id, tenant_id, and invoice_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tenant
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

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('invoice_number, amount')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('payment_number, amount, payment_date, method')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch landlord profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Your Landlord';
    const tenantName = `${tenant.first_name} ${tenant.last_name}`;
    const amountFormatted = `J$${Number(payment.amount).toLocaleString()}`;

    const methodLabels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      card: 'Card',
      cash: 'Cash',
      other: 'Other',
    };

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
        from: 'EasyCollect <onboarding@resend.dev>',
        to: tenant.email,
        subject: `Payment Receipt — ${amountFormatted}`,
        html: buildEmailHtml('Payment Receipt', `
            <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${tenantName},</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Your payment has been confirmed. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Invoice</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Amount Paid</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #16a34a; border-bottom: 1px solid #e5e7eb;">${amountFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Payment Date</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${payment.payment_date}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Method</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${methodLabels[payment.method] ?? payment.method}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280;">Payment Reference</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${payment.payment_number}</td>
              </tr>
            </table>
            <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">Thank you for your payment.</p>
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
