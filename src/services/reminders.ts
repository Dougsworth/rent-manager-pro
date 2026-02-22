import { supabase } from '@/lib/supabase';

export async function sendReminder(tenantId: string, invoiceId: string) {
  const { data, error } = await supabase.functions.invoke('send-reminder', {
    body: { tenant_id: tenantId, invoice_id: invoiceId },
  });

  if (error) throw error;
  return data;
}
