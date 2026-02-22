import { supabase } from '@/lib/supabase';

export async function updateProfile(userId: string, updates: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompanyInfo(userId: string, updates: {
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_country?: string;
  company_website?: string;
  company_tax_id?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBankDetails(userId: string, updates: {
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: { payments: boolean; overdue: boolean; invoices: boolean }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ notification_preferences: preferences } as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
