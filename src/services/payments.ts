import { supabase } from '@/lib/supabase';
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
  if (payment.invoice_id) {
    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', payment.invoice_id);
  }

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
