import { supabase } from '@/lib/supabase';
import type { ActivityLog, ActivityLogAction } from '@/types/app.types';

export async function getActivityLogs(
  landlordId: string,
  filters?: { action?: ActivityLogAction; entityType?: string },
): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }
  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return data ?? [];
}

export function logActivity(
  landlordId: string,
  action: ActivityLogAction,
  entityType: string,
  description: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  supabase
    .from('activity_logs')
    .insert({
      landlord_id: landlordId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      description,
      metadata: metadata ?? null,
    })
    .then(({ error }) => {
      if (error) console.error('Failed to log activity:', error);
    });
}
