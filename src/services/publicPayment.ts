import { supabase } from '@/lib/supabase';
import type { PublicInvoiceData } from '@/types/app.types';

export async function getInvoiceByToken(token: string): Promise<PublicInvoiceData | null> {
  const { data, error } = await supabase.rpc('get_invoice_by_token', { p_token: token });

  if (error) throw error;
  return data as PublicInvoiceData | null;
}

export async function uploadProofImagePublic(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `public/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function submitProofByToken(token: string, imageUrl: string) {
  const { data, error } = await supabase.rpc('submit_proof_by_token', {
    p_token: token,
    p_image_url: imageUrl,
  });

  if (error) throw error;
  return data;
}
