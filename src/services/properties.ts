import { supabase } from '@/lib/supabase';
import type { PropertyWithUnits } from '@/types/app.types';

export async function getProperties(landlordId: string): Promise<PropertyWithUnits[]> {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, units(*)')
    .eq('landlord_id', landlordId)
    .order('name');

  if (error) throw error;
  return (properties ?? []) as PropertyWithUnits[];
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
