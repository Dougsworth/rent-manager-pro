import { supabase } from '@/lib/supabase';
import { createNotification } from '@/services/notifications';
import { logActivity } from '@/services/activityLog';
import type { PaymentWithDetails } from '@/types/app.types';

export async function getPayments(landlordId: string): Promise<PaymentWithDetails[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      tenant:tenants(first_name, last_name, unit:units(name, property:properties(name))),
      invoice:invoices(invoice_number)
    `)
    .eq('landlord_id', landlordId)
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((p): PaymentWithDetails => {
    const tenant = p.tenant as any;
    const invoice = p.invoice as any;
    return {
      ...p,
      tenant_first_name: tenant?.first_name ?? '',
      tenant_last_name: tenant?.last_name ?? '',
      unit_name: tenant?.unit?.name ?? '',
      property_name: tenant?.unit?.property?.name ?? '',
      invoice_number: invoice?.invoice_number ?? null,
    };
  });
}

export async function createPayment(landlordId: string, payment: {
  tenant_id: string;
  invoice_id?: string | null;
  amount: number;
  payment_date?: string;
  method?: 'bank_transfer' | 'card' | 'cash' | 'other';
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...payment,
      landlord_id: landlordId,
      payment_number: 'TEMP', // trigger will overwrite
    })
    .select()
    .single();

  if (error) throw error;

  // If linked to an invoice, mark it as paid
  let linkedInvoiceId = payment.invoice_id;

  if (linkedInvoiceId) {
    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', linkedInvoiceId);
  } else {
    // Auto-link: if no invoice specified, find a matching unpaid invoice for this tenant
    const { data: unpaidInvoices } = await supabase
      .from('invoices')
      .select('id, amount')
      .eq('tenant_id', payment.tenant_id)
      .eq('landlord_id', landlordId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(5);

    if (unpaidInvoices && unpaidInvoices.length > 0) {
      // Only auto-link if we find an exact amount match — don't guess on partial payments
      const exactMatch = unpaidInvoices.find(inv => inv.amount === payment.amount);

      if (exactMatch) {
        linkedInvoiceId = exactMatch.id;

        await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', exactMatch.id);

        // Update the payment record to link it
        await supabase
          .from('payments')
          .update({ invoice_id: exactMatch.id })
          .eq('id', (data as any).id);

        logActivity(landlordId, 'invoice_updated', 'invoice', `Invoice auto-marked as paid via payment`, exactMatch.id, { payment_amount: payment.amount });
      }
    }
  }

  // Fire-and-forget notification
  const { data: tenant } = await supabase
    .from('tenants')
    .select('first_name, last_name')
    .eq('id', payment.tenant_id)
    .single();
  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'A tenant';
  createNotification(
    landlordId,
    'payment_received',
    'Payment Received',
    `${tenantName} paid J$${payment.amount.toLocaleString()}`,
    (data as any).id,
  );
  logActivity(landlordId, 'payment_created', 'payment', `Recorded payment from ${tenantName} — J$${payment.amount.toLocaleString()}`, (data as any).id, { amount: payment.amount, method: payment.method });

  return data;
}

export async function getPaymentsForTenant(tenantId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice:invoices(invoice_number)')
    .eq('tenant_id', tenantId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
