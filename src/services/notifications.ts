import { supabase } from '@/lib/supabase';
import type { Notification, NotificationType } from '@/types/app.types';

export async function getNotifications(
  landlordId: string,
  filters?: { isRead?: boolean; type?: NotificationType },
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (filters?.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(landlordId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('landlord_id', landlordId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(landlordId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('landlord_id', landlordId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

export async function clearAllNotifications(landlordId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('landlord_id', landlordId);

  if (error) throw error;
}

export async function createNotification(
  landlordId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityId?: string,
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      landlord_id: landlordId,
      type,
      title,
      message,
      related_entity_id: relatedEntityId ?? null,
    });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}
