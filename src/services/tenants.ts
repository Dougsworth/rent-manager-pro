import { supabase } from '@/lib/supabase';
import { createNotification } from '@/services/notifications';
import { logActivity } from '@/services/activityLog';
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

  // Determine payment status per tenant by checking ALL invoices (worst status wins)
  // Priority: overdue > pending > paid
  const tenantIds = rows.map(t => t.id as string);
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('tenant_id, status')
    .eq('landlord_id', landlordId)
    .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['__none__']);

  const invoiceRows = (invoiceData ?? []) as any[];
  const statusMap = new Map<string, 'paid' | 'pending' | 'overdue'>();
  for (const inv of invoiceRows) {
    const current = statusMap.get(inv.tenant_id);
    const incoming = inv.status as 'paid' | 'pending' | 'overdue';

    // Escalate to worst status: overdue > pending > paid
    if (!current) {
      statusMap.set(inv.tenant_id, incoming);
    } else if (incoming === 'overdue') {
      statusMap.set(inv.tenant_id, 'overdue');
    } else if (incoming === 'pending' && current !== 'overdue') {
      statusMap.set(inv.tenant_id, 'pending');
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

  // Fire-and-forget notification
  const tenantName = `${tenant.first_name} ${tenant.last_name}`.trim();
  createNotification(
    landlordId,
    'tenant_added',
    'Tenant Added',
    `${tenantName} has been added to your roster`,
    (data as any).id,
  );

  logActivity(landlordId, 'tenant_added', 'tenant', `Added tenant ${tenantName}`, (data as any).id);

  // Fire-and-forget welcome email
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: (data as any).id }),
      }).catch((err) => console.error('Welcome email failed:', err));
    }
  } catch (err) {
    console.error('Welcome email trigger error:', err);
  }

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

  const name = [updates.first_name, updates.last_name].filter(Boolean).join(' ');
  logActivity((data as any).landlord_id, 'tenant_updated', 'tenant', `Updated tenant${name ? ` ${name}` : ''}`, tenantId, updates);

  return data;
}

export async function deleteTenant(tenantId: string) {
  // Clean up payment_proofs first (FK lacks CASCADE until migration 014 is applied)
  await supabase
    .from('payment_proofs')
    .delete()
    .eq('tenant_id', tenantId);

  // Get tenant info before deleting for the log
  const { data: tenantInfo } = await supabase
    .from('tenants')
    .select('landlord_id, first_name, last_name')
    .eq('id', tenantId)
    .single();

  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId);

  if (error) throw error;

  if (tenantInfo) {
    const name = `${tenantInfo.first_name} ${tenantInfo.last_name}`.trim();
    logActivity(tenantInfo.landlord_id, 'tenant_deleted', 'tenant', `Deleted tenant ${name}`, tenantId);
  }
}
