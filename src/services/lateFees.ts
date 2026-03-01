import { supabase } from '@/lib/supabase';
import type { LateFeeSettings } from '@/types/app.types';

export async function getLateFeeSettings(landlordId: string): Promise<LateFeeSettings | null> {
  const { data, error } = await supabase
    .from('late_fee_settings')
    .select('*')
    .eq('landlord_id', landlordId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertLateFeeSettings(
  landlordId: string,
  settings: {
    fee_type: 'flat' | 'percentage';
    fee_value: number;
    grace_period_days: number;
    auto_apply: boolean;
  },
): Promise<LateFeeSettings> {
  const { data, error } = await supabase
    .from('late_fee_settings')
    .upsert(
      { landlord_id: landlordId, ...settings },
      { onConflict: 'landlord_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
