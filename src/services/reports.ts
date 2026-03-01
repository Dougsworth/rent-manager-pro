import { supabase } from '@/lib/supabase';
import type { MonthlyCollectionData, PropertyCollectionData, PnLData } from '@/types/app.types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function getCollectionByMonth(
  landlordId: string,
  startDate: string,
  endDate: string
): Promise<MonthlyCollectionData[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, status, due_date')
    .eq('landlord_id', landlordId)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  if (error) throw error;

  const byMonth = new Map<string, MonthlyCollectionData>();

  for (const inv of data ?? []) {
    const month = inv.due_date.slice(0, 7); // YYYY-MM
    if (!byMonth.has(month)) {
      const [y, m] = month.split('-').map(Number);
      byMonth.set(month, {
        month,
        monthLabel: `${MONTH_LABELS[m - 1]} ${y}`,
        expected: 0,
        collected: 0,
        outstanding: 0,
      });
    }
    const entry = byMonth.get(month)!;
    entry.expected += inv.amount;
    if (inv.status === 'paid') {
      entry.collected += inv.amount;
    } else {
      entry.outstanding += inv.amount;
    }
  }

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getCollectionByProperty(
  landlordId: string,
  startDate: string,
  endDate: string
): Promise<PropertyCollectionData[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      amount, status,
      tenant:tenants(unit:units(property_id, property:properties(name)))
    `)
    .eq('landlord_id', landlordId)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  if (error) throw error;

  const byProperty = new Map<string, PropertyCollectionData>();

  for (const inv of (data ?? []) as any[]) {
    const property = inv.tenant?.unit?.property;
    const propertyId = inv.tenant?.unit?.property_id;
    if (!propertyId) continue;

    if (!byProperty.has(propertyId)) {
      byProperty.set(propertyId, {
        property_id: propertyId,
        property_name: property?.name ?? 'Unknown',
        expected: 0,
        collected: 0,
        unit_count: 0,
      });
    }

    const entry = byProperty.get(propertyId)!;
    entry.expected += inv.amount;
    if (inv.status === 'paid') {
      entry.collected += inv.amount;
    }
  }

  return Array.from(byProperty.values());
}

export async function getPnLReport(
  landlordId: string,
  startDate: string,
  endDate: string
): Promise<PnLData> {
  const [byMonth, byProperty] = await Promise.all([
    getCollectionByMonth(landlordId, startDate, endDate),
    getCollectionByProperty(landlordId, startDate, endDate),
  ]);

  const totalExpected = byMonth.reduce((s, m) => s + m.expected, 0);
  const totalCollected = byMonth.reduce((s, m) => s + m.collected, 0);
  const totalOutstanding = byMonth.reduce((s, m) => s + m.outstanding, 0);
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  return {
    totalExpected,
    totalCollected,
    totalOutstanding,
    collectionRate,
    byMonth,
    byProperty,
  };
}
