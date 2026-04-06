import { supabase } from '@/lib/supabase';
import { logActivity } from '@/services/activityLog';
import type { Borrower } from '@/types/app.types';

export async function getBorrowers(landlordId: string): Promise<Borrower[]> {
  const { data, error } = await supabase
    .from('borrowers')
    .select('*')
    .eq('landlord_id', landlordId)
    .order('first_name');

  if (error) throw error;
  return (data ?? []) as Borrower[];
}

export async function addBorrower(landlordId: string, borrower: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('borrowers')
    .insert({ ...borrower, landlord_id: landlordId })
    .select()
    .single();

  if (error) throw error;

  const name = `${borrower.first_name} ${borrower.last_name}`.trim();
  logActivity(landlordId, 'borrower_added', 'borrower', `Added borrower ${name}`, (data as any).id);

  return data;
}

export async function updateBorrower(borrowerId: string, updates: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}) {
  const { data, error } = await supabase
    .from('borrowers')
    .update(updates)
    .eq('id', borrowerId)
    .select()
    .single();

  if (error) throw error;

  const name = [updates.first_name, updates.last_name].filter(Boolean).join(' ');
  logActivity((data as any).landlord_id, 'borrower_updated', 'borrower', `Updated borrower${name ? ` ${name}` : ''}`, borrowerId);

  return data;
}

export async function deleteBorrower(borrowerId: string) {
  const { data: info } = await supabase
    .from('borrowers')
    .select('landlord_id, first_name, last_name')
    .eq('id', borrowerId)
    .single();

  const { error } = await supabase
    .from('borrowers')
    .delete()
    .eq('id', borrowerId);

  if (error) throw error;

  if (info) {
    const name = `${info.first_name} ${info.last_name}`.trim();
    logActivity(info.landlord_id, 'borrower_deleted', 'borrower', `Deleted borrower ${name}`, borrowerId);
  }
}
