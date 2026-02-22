import { supabase } from '@/lib/supabase';
import type { DashboardStats, PaymentWithDetails } from '@/types/app.types';

export async function getDashboardStats(landlordId: string): Promise<DashboardStats> {
  const { count: tenantCount } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('landlord_id', landlordId)
    .eq('status', 'active');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('amount, status')
    .eq('landlord_id', landlordId)
    .gte('due_date', monthStart)
    .lte('due_date', monthEnd);

  const invoices = (invoiceData ?? []) as { amount: number; status: string }[];
  const expected = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collected = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const outstanding = expected - collected;
  const overdue = invoices.filter(i => i.status === 'overdue').length;

  return { expected, collected, outstanding, overdue, tenantCount: tenantCount ?? 0 };
}

export async function getRecentPayments(landlordId: string, limit = 5): Promise<PaymentWithDetails[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      tenant:tenants(first_name, last_name, unit:units(name, property:properties(name))),
      invoice:invoices(invoice_number)
    `)
    .eq('landlord_id', landlordId)
    .order('payment_date', { ascending: false })
    .limit(limit);

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

export async function getOverdueTenants(landlordId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      tenant:tenants(first_name, last_name, unit:units(name))
    `)
    .eq('landlord_id', landlordId)
    .eq('status', 'overdue')
    .order('due_date', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as any[]).map((inv) => {
    const tenant = inv.tenant as any;
    const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: inv.id as string,
      tenant_id: inv.tenant_id as string,
      invoice_id: inv.id as string,
      name: `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim(),
      unit: tenant?.unit?.name ?? '',
      amount: inv.amount as number,
      daysOverdue: Math.max(0, daysOverdue),
    };
  });
}
