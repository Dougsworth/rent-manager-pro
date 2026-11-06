import { supabase } from '@/lib/supabase';

export interface SearchEntry {
  id: string;
  kind: 'Tenant' | 'Borrower' | 'Property';
  title: string;
  detail: string;
  href: string;
}

/** Everything a person might look for, loaded once when search is first used. */
export async function getSearchIndex(landlordId: string): Promise<SearchEntry[]> {
  const [t, b, p] = await Promise.all([
    supabase.from('tenants').select('id, first_name, last_name, unit:units(name, property:properties(name))').eq('landlord_id', landlordId),
    supabase.from('borrowers').select('id, first_name, last_name, phone').eq('landlord_id', landlordId),
    supabase.from('properties').select('id, name, address').eq('landlord_id', landlordId),
  ]);
  return [
    ...((t.data ?? []) as any[]).map((x): SearchEntry => ({
      id: x.id, kind: 'Tenant', title: `${x.first_name} ${x.last_name}`.trim(),
      detail: [x.unit?.name, x.unit?.property?.name].filter(Boolean).join(', '), href: `/tenants/${x.id}`,
    })),
    ...((b.data ?? []) as any[]).map((x): SearchEntry => ({
      id: x.id, kind: 'Borrower', title: `${x.first_name} ${x.last_name}`.trim(), detail: x.phone ?? '', href: `/borrowers/${x.id}`,
    })),
    ...((p.data ?? []) as any[]).map((x): SearchEntry => ({
      id: x.id, kind: 'Property', title: x.name, detail: x.address ?? '', href: '/properties',
    })),
  ];
}
