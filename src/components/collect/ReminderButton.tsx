import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReminder } from '@/hooks/useReminder';

interface ReminderButtonProps {
  tenantId?: string;
  invoiceId?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function ReminderButton({ tenantId, invoiceId, className, size = 'default' }: ReminderButtonProps) {
  const { state, start, undo } = useReminder(tenantId, invoiceId);

  if (state === 'waiting') {
    return (
      <Button variant="outline" size={size} className={className} onClick={undo} aria-live="polite">
        Sending, tap to undo
      </Button>
    );
  }
  if (state === 'sending') return <Button size={size} className={className} disabled>Sending</Button>;
  if (state === 'sent') {
    return <span role="status" className={cn('inline-flex h-10 items-center justify-center whitespace-nowrap px-1 text-sm font-medium text-paid', className)}>Reminded today</span>;
  }
  return <Button size={size} className={className} onClick={start}>Send reminder</Button>;
}
