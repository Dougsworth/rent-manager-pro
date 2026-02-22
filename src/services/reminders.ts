import { supabase } from '@/lib/supabase';

export async function sendReminder(tenantId: string, invoiceId: string) {
  // Get the current session to ensure we have a valid token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('send-reminder', {
    body: { tenant_id: tenantId, invoice_id: invoiceId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data;
}
