import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import LuniPay from 'npm:lunipay';

// LuniPay sends the signature in this header. Confirm the exact name on the
// "Verify webhook signatures" docs page and adjust if it differs.
const SIGNATURE_HEADER = 'lunipay-signature';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const rawBody = await req.text();
    const secretKey = Deno.env.get('LUNIPAY_SECRET_KEY');
    const webhookSecret = Deno.env.get('LUNIPAY_WEBHOOK_SECRET');

    // The signed webhook is the source of truth — verify it when a secret is configured.
    let event: any;
    if (webhookSecret && secretKey) {
      const signature = req.headers.get(SIGNATURE_HEADER) ?? '';
      try {
        const lunipay = new LuniPay(secretKey);
        event = lunipay.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        console.error('Invalid LuniPay webhook signature:', err);
        return json({ error: 'Invalid signature' }, 401);
      }
    } else {
      // No secret configured yet (e.g. early test-mode wiring) — parse unverified.
      event = JSON.parse(rawBody);
    }

    console.log('LuniPay webhook event:', event.type, 'id:', event.data?.object?.id);

    if (event.type !== 'checkout.session.completed') {
      return json({ received: true }); // acknowledge events we don't fulfil
    }

    const session = event.data?.object;
    const metadata = session?.metadata || {};

    // Only invoice payments are wired today. Loan repayments will use type: 'loan'.
    if (metadata.type && metadata.type !== 'invoice') {
      console.log('Ignoring non-invoice checkout type:', metadata.type);
      return json({ received: true, ignored: true });
    }

    const invoiceId = metadata.invoice_id;
    const tenantId = metadata.tenant_id;
    const landlordId = metadata.landlord_id;

    if (!invoiceId || !tenantId || !landlordId) {
      console.error('Missing metadata in webhook:', JSON.stringify(metadata));
      return json({ error: 'Missing metadata' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, amount, invoice_number')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return json({ error: 'Invoice not found' }, 404);
    }
    if (invoice.status === 'paid') {
      return json({ received: true, already_paid: true });
    }

    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);

    const transactionId = session.id ?? session.payment_intent ?? null;
    const paymentAmount = session.amount_cents ? session.amount_cents / 100 : invoice.amount;

    await supabase.from('payments').insert({
      invoice_id: invoiceId,
      tenant_id: tenantId,
      landlord_id: landlordId,
      amount: paymentAmount,
      payment_date: new Date().toISOString().split('T')[0],
      method: 'card',
      status: 'completed',
      transaction_id: transactionId,
      notes: `Paid online via LuniPay${transactionId ? ` — ${transactionId}` : ''}`,
      payment_number: 'TEMP',
    });

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

    // Correct table is activity_logs (plural) with related_entity_id — the HandyPay
    // webhook used the wrong name and silently failed to log.
    await supabase.from('activity_logs').insert({
      landlord_id: landlordId,
      action: 'payment_created',
      entity_type: 'payment',
      description: `Online payment from ${tenantName} — J$${paymentAmount.toLocaleString()} via LuniPay`,
      related_entity_id: invoiceId,
      metadata: { amount: paymentAmount, method: 'card', transaction_id: transactionId },
    });

    console.log(`Invoice ${invoiceId} marked paid via LuniPay`);
    return json({ received: true, invoice_paid: true });
  } catch (err) {
    console.error('LuniPay webhook error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
