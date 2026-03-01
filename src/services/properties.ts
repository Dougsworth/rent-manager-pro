import { supabase } from '@/lib/supabase';
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
  return data;
}

export async function deleteProperty(propertyId: string) {
  // Check for tenants assigned to any unit in this property
  const { data: units } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId);

  if (units && units.length > 0) {
    const unitIds = units.map(u => u.id);
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .in('unit_id', unitIds)
      .limit(1);

    if (tenants && tenants.length > 0) {
      throw new Error('Cannot delete property with assigned tenants. Remove tenants first.');
    }

    // Delete all units
    const { error: unitError } = await supabase
      .from('units')
      .delete()
      .eq('property_id', propertyId);

    if (unitError) throw unitError;
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) throw error;
}

export async function updateUnit(unitId: string, updates: { name?: string; rent_amount?: number }) {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUnit(unitId: string) {
  // Check for tenants assigned to this unit
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('unit_id', unitId)
    .limit(1);

  if (tenants && tenants.length > 0) {
    throw new Error('Cannot delete unit with assigned tenants. Remove tenants first.');
  }

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (error) throw error;
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
