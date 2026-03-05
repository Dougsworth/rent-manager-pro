import { supabase } from '@/lib/supabase';
import { logActivity } from '@/services/activityLog';
import type { PropertyWithUnits } from '@/types/app.types';

export async function getProperties(landlordId: string): Promise<PropertyWithUnits[]> {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, units(*)')
    .eq('landlord_id', landlordId)
    .order('name');

  if (error) throw error;
  return (properties ?? []) as unknown as PropertyWithUnits[];
}

export async function createProperty(landlordId: string, name: string, address: string) {
  const { data, error } = await supabase
    .from('properties')
    .insert({ landlord_id: landlordId, name, address })
    .select()
    .single();

  if (error) throw error;

  logActivity(landlordId, 'property_created', 'property', `Created property "${name}"`, (data as any).id);

  return data;
}

export async function getUnits(propertyId: string) {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createUnit(propertyId: string, name: string, rentAmount: number) {
  const { data, error } = await supabase
    .from('units')
    .insert({ property_id: propertyId, name, rent_amount: rentAmount })
    .select()
    .single();

  if (error) throw error;

  // Get landlord_id from the property for logging
  const { data: prop } = await supabase.from('properties').select('landlord_id').eq('id', propertyId).single();
  if (prop) {
    logActivity(prop.landlord_id, 'unit_created', 'unit', `Created unit "${name}" (J$${rentAmount.toLocaleString()})`, (data as any).id, { rent_amount: rentAmount });
  }

  return data;
}

export async function updateProperty(propertyId: string, updates: { name?: string; address?: string }) {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  if (error) throw error;

  logActivity((data as any).landlord_id, 'property_updated', 'property', `Updated property "${(data as any).name}"`, propertyId, updates);

  return data;
}

export async function deleteProperty(propertyId: string) {
  // Get property info before deleting for the log
  const { data: propInfo } = await supabase
    .from('properties')
    .select('landlord_id, name')
    .eq('id', propertyId)
    .single();

  // Unassign any tenants from units in this property (set unit_id to null)
  const { data: units } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId);

  if (units && units.length > 0) {
    const unitIds = units.map(u => u.id);
    await supabase
      .from('tenants')
      .update({ unit_id: null })
      .in('unit_id', unitIds);
  }

  // Delete property — units cascade via DB FK
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) throw error;

  if (propInfo) {
    logActivity(propInfo.landlord_id, 'property_deleted', 'property', `Deleted property "${propInfo.name}"`, propertyId);
  }
}

export async function updateUnit(unitId: string, updates: { name?: string; rent_amount?: number }) {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId)
    .select('*, property:properties(landlord_id)')
    .single();

  if (error) throw error;

  const landlordId = (data as any).property?.landlord_id;
  if (landlordId) {
    logActivity(landlordId, 'unit_updated', 'unit', `Updated unit "${(data as any).name}"`, unitId, updates);
  }

  return data;
}

export async function deleteUnit(unitId: string) {
  // Get unit info before deleting for the log
  const { data: unitInfo } = await supabase
    .from('units')
    .select('name, property:properties(landlord_id)')
    .eq('id', unitId)
    .single();

  // Unassign any tenants from this unit first
  await supabase
    .from('tenants')
    .update({ unit_id: null })
    .eq('unit_id', unitId);

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (error) throw error;

  const landlordId = (unitInfo as any)?.property?.landlord_id;
  if (landlordId) {
    logActivity(landlordId, 'unit_deleted', 'unit', `Deleted unit "${(unitInfo as any).name}"`, unitId);
  }
}

export async function getPropertyOccupancy(landlordId: string): Promise<Map<string, { tenant_name: string; tenant_id: string }>> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, unit_id')
    .eq('landlord_id', landlordId)
    .not('unit_id', 'is', null);

  if (error) throw error;

  const map = new Map<string, { tenant_name: string; tenant_id: string }>();
  for (const t of data ?? []) {
    if (t.unit_id) {
      map.set(t.unit_id, {
        tenant_name: `${t.first_name} ${t.last_name}`,
        tenant_id: t.id,
      });
    }
  }
  return map;
}
