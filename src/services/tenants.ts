import { supabase } from '@/lib/supabase';
import type { TenantWithDetails } from '@/types/app.types';

export async function getTenants(landlordId: string): Promise<TenantWithDetails[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      unit:units(name, rent_amount, property:properties(name))
    `)
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as any[];

  // Determine payment status per tenant by checking their latest invoice
  const tenantIds = rows.map(t => t.id as string);
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('tenant_id, status')
    .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['__none__']);

  const invoiceRows = (invoiceData ?? []) as any[];
  const statusMap = new Map<string, 'paid' | 'pending' | 'overdue'>();
  for (const inv of invoiceRows) {
    if (!statusMap.has(inv.tenant_id)) {
      statusMap.set(inv.tenant_id, inv.status as 'paid' | 'pending' | 'overdue');
    }
  }

  return rows.map((t): TenantWithDetails => {
    const unit = t.unit as any;
    return {
      ...t,
      unit_name: unit?.name ?? '',
      property_name: unit?.property?.name ?? '',
      rent_amount: unit?.rent_amount ?? 0,
      payment_status: statusMap.get(t.id) ?? 'pending',
    };
  });
}

export async function addTenant(landlordId: string, tenant: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  unit_id: string | null;
  lease_start: string | null;
  lease_end: string | null;
}) {
  const { data, error } = await supabase
    .from('tenants')
    .insert({ ...tenant, landlord_id: landlordId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTenant(tenantId: string, updates: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  unit_id?: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
  status?: 'active' | 'inactive';
}) {
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTenant(tenantId: string) {
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId);

  if (error) throw error;
}
