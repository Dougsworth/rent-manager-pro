import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { tenant_id, invoice_id } = await req.json();
    if (!tenant_id || !invoice_id) {
      return new Response(JSON.stringify({ error: 'tenant_id and invoice_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      .select('amount, due_date, invoice_number')
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
      .select('company_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Your Landlord';
    const tenantName = `${tenant.first_name} ${tenant.last_name}`;
    const amountFormatted = `J$${Number(invoice.amount).toLocaleString()}`;

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
        from: 'EasyRentCollect <onboarding@resend.dev>',
        to: tenant.email,
        subject: `Payment Reminder — ${amountFormatted} due`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1e40af;">Payment Reminder</h2>
            <p>Hi ${tenantName},</p>
            <p>This is a friendly reminder that you have an outstanding payment:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Invoice</td>
                <td style="padding: 8px 0; font-weight: 600;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Amount Due</td>
                <td style="padding: 8px 0; font-weight: 600; color: #dc2626;">${amountFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Due Date</td>
                <td style="padding: 8px 0; font-weight: 600;">${invoice.due_date}</td>
              </tr>
            </table>
            <p>Please make your payment at your earliest convenience.</p>
            <p style="color: #6b7280; margin-top: 24px;">— ${companyName}</p>
          </div>
        `,
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
