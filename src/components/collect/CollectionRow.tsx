import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { PaymentLouvre } from './PaymentLouvre';
import { QuickPayment } from './QuickPayment';
import { ReminderButton } from './ReminderButton';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/lib/utils';
import type { CollectionItem } from '@/services/collections';

export function timingLabel(item: CollectionItem): string {
  if (item.daysLate > 0) return `${item.daysLate} ${item.daysLate === 1 ? 'day' : 'days'} late`;
  if (item.daysUntilDue === 0) return 'Due today';
  return `In ${item.daysUntilDue} ${item.daysUntilDue === 1 ? 'day' : 'days'}`;
}

interface CollectionRowProps {
  item: CollectionItem;
  landlordId: string;
  onChanged: () => void;
}

/** One person who owes you. Same content and actions on desktop and phone, different arrangement. */
export function CollectionRow({ item, landlordId, onChanged }: CollectionRowProps) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const late = item.daysLate > 0;
  const profile = item.kind === 'rent' ? `/tenants/${item.personId}` : `/borrowers/${item.personId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${item.paymentToken}`);
      toast('Pay link copied. Paste it in WhatsApp or an email.', 'success');
    } catch {
      toast('Could not copy the link. Open the invoice to share it.', 'error');
    }
  };

  const primary = late && item.kind === 'rent'
    ? <ReminderButton tenantId={item.personId} invoiceId={item.invoiceId} className="flex-1 lg:flex-none" />
    : item.kind === 'rent' && item.paymentToken
      ? <Button variant="outline" onClick={copyLink} className="flex-1 lg:flex-none">Copy pay link</Button>
      : null;

  return (
    <li className="border-t border-rule">
      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 py-3 lg:grid-cols-[minmax(170px,1.4fr)_176px_104px_104px_minmax(236px,auto)] lg:items-center">
        <div className="min-w-0">
          <Link to={profile} className={cn('block truncate text-base text-ink hover:underline', late ? 'font-semibold' : 'font-medium')}>{item.name}</Link>
          <div className="truncate text-[13.5px] text-quiet">{item.what}</div>
        </div>
        <div className="num text-right text-base font-semibold lg:order-4">{formatMoney(item.amount)}</div>
        <div className="col-span-2 flex items-center justify-between gap-4 lg:order-3 lg:col-span-1 lg:block">
          <div className={cn('text-sm', late ? 'font-semibold text-late' : 'text-ink')}>{timingLabel(item)}</div>
          <div className="text-[13.5px] text-quiet">Due {formatDate(item.dueDate).replace(/, \d{4}$/, '')}</div>
        </div>
        <PaymentLouvre months={item.history} className="col-span-2 lg:order-2 lg:col-span-1" />
        <div className="col-span-2 flex gap-2 lg:order-5 lg:col-span-1 lg:justify-end">
          {primary}
          <Button variant="outline" onClick={() => setPaying((v) => !v)} aria-expanded={paying} className="flex-1 lg:flex-none">Mark paid</Button>
        </div>
      </div>
      {paying && (
        <QuickPayment landlordId={landlordId} item={item} onCancel={() => setPaying(false)} onDone={() => { setPaying(false); onChanged(); }} />
      )}
    </li>
  );
}
