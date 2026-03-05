import { supabase } from '@/lib/supabase';
import type { RecurringInvoiceSettings } from '@/types/app.types';

export async function getRecurringInvoiceSettings(landlordId: string): Promise<RecurringInvoiceSettings | null> {
  const { data, error } = await supabase
    .from('recurring_invoice_settings')
    .select('*')
    .eq('landlord_id', landlordId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertRecurringInvoiceSettings(
  landlordId: string,
  settings: {
    enabled: boolean;
    day_of_month: number;
    send_emails: boolean;
    description_template: string;
  },
): Promise<RecurringInvoiceSettings> {
  const { data, error } = await supabase
    .from('recurring_invoice_settings')
    .upsert(
      { landlord_id: landlordId, ...settings },
      { onConflict: 'landlord_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
