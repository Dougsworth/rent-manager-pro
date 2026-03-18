import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const API_URL = 'https://api.handypay.me/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invoice_id, success_url, cancel_url } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: 'invoice_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('HANDYPAY_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'HandyPay API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, description, status, tenant_id, landlord_id, payment_token')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invoice.status === 'paid') {
      return new Response(JSON.stringify({ error: 'Invoice is already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tenant name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('first_name, last_name')
      .eq('id', invoice.tenant_id)
      .single();

    const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Tenant';
    const amountInCents = Math.round(invoice.amount * 100);
    const defaultOrigin = req.headers.get('origin') || 'https://easycollectja.com';

    // Create payment session with custom amount — no product needed
    const res = await fetch(`${API_URL}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line_items: [
          {
            amount: amountInCents,
            currency: 'jmd',
            name: `${invoice.invoice_number} — ${invoice.description || 'Rent Payment'} for ${tenantName}`,
            quantity: 1,
          },
        ],
        success_url: success_url || `${defaultOrigin}/pay/${invoice.payment_token}?status=success`,
        cancel_url: cancel_url || `${defaultOrigin}/pay/${invoice.payment_token}?status=cancelled`,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          tenant_id: invoice.tenant_id,
          landlord_id: invoice.landlord_id,
        },
      }),
    });

    const json = await res.json();
    console.log('HandyPay payment session response:', JSON.stringify(json));

    if (!json.success) {
      return new Response(JSON.stringify({
        error: json.error?.message || 'Failed to create payment session',
        code: json.error?.code,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_url: json.data.url,
      session_id: json.data.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('HandyPay checkout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
