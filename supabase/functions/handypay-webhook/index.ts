import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Verify HMAC-SHA256 webhook signature
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = `sha256=${Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  return signature === expected;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();

    // Verify signature if webhook secret is configured
    const webhookSecret = Deno.env.get('HANDYPAY_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-handypay-signature') ?? '';
      const valid = await verifySignature(body, signature, webhookSecret);
      if (!valid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.parse(body);
    console.log('HandyPay webhook event:', payload.type, 'id:', payload.data?.id);

    const event = payload.type;
    const data = payload.data;

    if (!data) {
      return new Response(JSON.stringify({ error: 'No data in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle payment completion events
    const isPaymentComplete = [
      'payment_intent.succeeded',
      'checkout.session.completed',
    ].includes(event);

    if (!isPaymentComplete) {
      // Acknowledge non-payment events
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const metadata = data.metadata || {};
    const invoiceId = metadata.invoice_id;
    const tenantId = metadata.tenant_id;
    const landlordId = metadata.landlord_id;

    if (!invoiceId || !tenantId || !landlordId) {
      console.error('Missing metadata in webhook:', JSON.stringify(metadata));
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check invoice exists and isn't already paid
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, amount, invoice_number')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (invoice.status === 'paid') {
      return new Response(JSON.stringify({ received: true, already_paid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark invoice as paid
    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId);

    // Create payment record
    const transactionId = data.id || data.transaction_id || null;
    const paymentAmount = data.amount ? data.amount / 100 : invoice.amount;

    await supabase.from('payments').insert({
      invoice_id: invoiceId,
      tenant_id: tenantId,
      landlord_id: landlordId,
      amount: paymentAmount,
      payment_date: new Date().toISOString().split('T')[0],
      method: 'card',
      status: 'completed',
      transaction_id: transactionId,
      notes: `Paid online via HandyPay${transactionId ? ` — ${transactionId}` : ''}`,
      payment_number: 'TEMP',
    });

    // Notify landlord
    const { data: tenant } = await supabase
      .from('tenants')
      .select('first_name, last_name')
      .eq('id', tenantId)
      .single();

    const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'A tenant';
    await supabase.from('notifications').insert({
      landlord_id: landlordId,
      type: 'payment_received',
      title: 'Online Payment Received',
      message: `${tenantName} paid J$${paymentAmount.toLocaleString()} online for ${invoice.invoice_number}`,
      related_entity_id: invoiceId,
    });

    // Log activity
    await supabase.from('activity_log').insert({
      landlord_id: landlordId,
      action: 'payment_created',
      entity_type: 'payment',
      description: `Online payment from ${tenantName} — J$${paymentAmount.toLocaleString()} via HandyPay`,
      entity_id: invoiceId,
      metadata: { amount: paymentAmount, method: 'card', transaction_id: transactionId },
    });

    console.log(`Invoice ${invoiceId} marked paid via HandyPay`);

    return new Response(JSON.stringify({ received: true, invoice_paid: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
