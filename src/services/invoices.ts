import { supabase } from '@/lib/supabase';
import type { InvoiceWithTenant } from '@/types/app.types';

export async function getInvoices(landlordId: string): Promise<InvoiceWithTenant[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      tenant:tenants(first_name, last_name, unit:units(name, property:properties(name)))
    `)
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((inv): InvoiceWithTenant => {
    const tenant = inv.tenant as any;
    return {
      ...inv,
      tenant_first_name: tenant?.first_name ?? '',
      tenant_last_name: tenant?.last_name ?? '',
      unit_name: tenant?.unit?.name ?? '',
      property_name: tenant?.unit?.property?.name ?? '',
    };
  });
}

export async function createInvoice(landlordId: string, invoice: {
  tenant_id: string;
  amount: number;
  due_date: string;
  issue_date?: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      landlord_id: landlordId,
      invoice_number: 'TEMP', // trigger will overwrite
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvoicesForTenant(tenantId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('due_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateInvoice(invoiceId: string, updates: {
  status?: 'paid' | 'pending' | 'overdue';
  amount?: number;
  due_date?: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
