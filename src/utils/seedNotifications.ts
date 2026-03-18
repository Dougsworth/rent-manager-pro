import { supabase } from '@/lib/supabase';
import type { NotificationType } from '@/types/app.types';

const sampleNotifications: {
  type: NotificationType;
  title: string;
  message: string;
}[] = [
  {
    type: 'payment_received',
    title: 'Payment Received',
    message: 'John Smith paid J$45,000 for March rent',
  },
  {
    type: 'proof_submitted',
    title: 'Payment Proof Submitted',
    message: 'Sarah Brown submitted a payment proof for review',
  },
  {
    type: 'invoice_created',
    title: 'Invoice Created',
    message: 'Invoice for Marcus Lee — J$38,000 due 2026-04-01',
  },
  {
    type: 'payment_overdue',
    title: 'Payment Overdue',
    message: 'Invoice INV-0042 is 7 days past due',
  },
  {
    type: 'tenant_added',
    title: 'Tenant Added',
    message: 'New tenant Lisa Williams added to Unit 3B',
  },
  {
    type: 'proof_approved',
    title: 'Payment Proof Approved',
    message: 'Payment proof approved — J$45,000 recorded',
  },
  {
    type: 'proof_rejected',
    title: 'Payment Proof Rejected',
    message: 'A payment proof was rejected: image unclear',
  },
  {
    type: 'late_fee_applied',
    title: 'Late Fee Applied',
    message: 'Late fee of J$2,500 applied to an overdue invoice',
  },
  {
    type: 'lease_expiring',
    title: 'Lease Expiring Soon',
    message: "Marcus Lee's lease expires in 30 days",
  },
  {
    type: 'system',
    title: 'Welcome to EasyCollect',
    message: 'Your account is set up and ready to go!',
  },
];

export async function seedTestNotifications(landlordId: string): Promise<number> {
  const now = new Date();
  const rows = sampleNotifications.map((n, i) => ({
    landlord_id: landlordId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: i >= 5, // first 5 are unread
    created_at: new Date(now.getTime() - i * 3600000).toISOString(), // stagger by 1 hour each
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;
  return rows.length;
}
