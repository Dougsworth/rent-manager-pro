import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import LuniPay from 'npm:lunipay';
import { corsHeaders } from '../_shared/cors.ts';

// JMD by default; override with the LUNIPAY_CURRENCY secret if LuniPay needs a different code.
const CURRENCY = Deno.env.get('LUNIPAY_CURRENCY') || 'jmd';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { invoice_id, success_url, cancel_url } = await req.json();
    if (!invoice_id) {
      return jsonResponse({ error: 'invoice_id is required' }, 400);
    }

    const secretKey = Deno.env.get('LUNIPAY_SECRET_KEY');
    if (!secretKey) {
      return jsonResponse({ error: 'LuniPay secret key not configured' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, description, status, tenant_id, landlord_id, payment_token')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return jsonResponse({ error: 'Invoice not found' }, 404);
    }
    if (invoice.status === 'paid') {
      return jsonResponse({ error: 'Invoice is already paid' }, 400);
    }

    const amountInCents = Math.round(invoice.amount * 100);
    const defaultOrigin = req.headers.get('origin') || 'https://easycollectja.com';

    // Route the payment to the landlord's own LuniPay connected account so the
    // money goes to them, not the platform. Falls back to the platform account
    // until the landlord has connected (set up in Settings → Payouts).
    const { data: landlord } = await supabase
      .from('profiles')
      .select('connected_account_id, payouts_enabled')
      .eq('id', invoice.landlord_id)
      .single();

    const destination = landlord?.payouts_enabled ? landlord.connected_account_id : null;
    const feeBps = Number(Deno.env.get('LUNIPAY_PLATFORM_FEE_BPS') || '0');
    const connectParams = destination
      ? {
          payment_intent_data: {
            transfer_data: { destination },
            ...(feeBps > 0 ? { application_fee_amount: Math.round((amountInCents * feeBps) / 10000) } : {}),
          },
        }
      : {};

    const lunipay = new LuniPay(secretKey);
    const session = await lunipay.checkout.sessions.create({
      amount: amountInCents,
      currency: CURRENCY,
      // Be explicit so the session doesn't depend on auto-detected methods for the
      // currency. Override via LUNIPAY_PAYMENT_METHODS (comma-separated) if needed.
      payment_method_types: (Deno.env.get('LUNIPAY_PAYMENT_METHODS') || 'card')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      ...connectParams,
      success_url: success_url || `${defaultOrigin}/pay/${invoice.payment_token}?status=success`,
      cancel_url: cancel_url || `${defaultOrigin}/pay/${invoice.payment_token}?status=cancelled`,
      // Metadata is the contract the webhook reads to fulfil the right invoice.
      metadata: {
        type: 'invoice',
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        tenant_id: invoice.tenant_id,
        landlord_id: invoice.landlord_id,
      },
    });

    return jsonResponse({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    console.error('LuniPay checkout error:', err);
    return jsonResponse({ error: 'Failed to create checkout session' }, 500);
  }
});
