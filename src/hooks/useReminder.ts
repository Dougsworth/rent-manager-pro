import { useCallback, useEffect, useRef, useState } from 'react';
import { sendReminder } from '@/services/reminders';
import { useToast } from '@/components/ui/toast';
import { isoDate } from '@/services/collections';

export type ReminderState = 'idle' | 'waiting' | 'sending' | 'sent';

const UNDO_MS = 5000;
const storeKey = (invoiceId: string) => `ec-reminded-${invoiceId}`;

function remindedToday(invoiceId: string): boolean {
  try { return localStorage.getItem(storeKey(invoiceId)) === isoDate(new Date()); } catch { return false; }
}

/**
 * One click reminder with a short undo window. Email is only sent once the
 * window closes, so Undo is honest. "Reminded today" is remembered on this device.
 */
export function useReminder(tenantId?: string, invoiceId?: string) {
  const { toast } = useToast();
  const [state, setState] = useState<ReminderState>(() => (invoiceId && remindedToday(invoiceId) ? 'sent' : 'idle'));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);

  const fire = useCallback(async () => {
    if (!tenantId || !invoiceId) return;
    pending.current = false;
    setState('sending');
    try {
      const result = await sendReminder(tenantId, invoiceId);
      if (result?.skipped) {
        setState('idle');
        toast('Reminders are switched off. Turn them on in Settings, Notifications.', 'error');
        return;
      }
      try { localStorage.setItem(storeKey(invoiceId), isoDate(new Date())); } catch { /* per device only */ }
      setState('sent');
    } catch (err) {
      console.error('Failed to send reminder:', err);
      setState('idle');
      toast('That reminder did not send. Check your connection and try again.', 'error');
    }
  }, [tenantId, invoiceId, toast]);

  const start = useCallback(() => {
    pending.current = true;
    setState('waiting');
    timer.current = setTimeout(fire, UNDO_MS);
  }, [fire]);

  const undo = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = false;
    setState('idle');
  }, []);

  // Leaving the page should not silently drop a reminder the person asked for.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (pending.current && tenantId && invoiceId) {
      sendReminder(tenantId, invoiceId).catch((err) => console.error('Failed to send reminder:', err));
    }
  }, [tenantId, invoiceId]);

  return { state, start, undo };
}
