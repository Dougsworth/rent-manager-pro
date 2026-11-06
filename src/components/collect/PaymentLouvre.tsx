import { cn } from '@/lib/utils';
import { summarizeHistory, type HistoryMonth } from '@/services/collections';

interface PaymentLouvreProps {
  months: HistoryMonth[];
  size?: 'sm' | 'lg';
  /** Month letters under the row. Keeps it readable without a legend. */
  labels?: boolean;
  className?: string;
}

const LATE = 'border border-late hatch-late';

const fin: Record<HistoryMonth['state'], string> = {
  paid: 'bg-paid h-full',
  'paid-late': 'bg-paid h-3/5',
  late: `${LATE} h-full`,
  due: 'border border-paid h-full',
  none: 'bg-[#e6e4dc] h-full',
};

/**
 * The louvre row: one fin per month, oldest first. Full is paid on time, short
 * is paid late, hatched is late now, outlined is due, grey is before they began.
 * Meaning is carried by shape, so it survives colour blindness and bad screens.
 */
export function PaymentLouvre({ months, size = 'sm', labels = true, className }: PaymentLouvreProps) {
  const lg = size === 'lg';
  return (
    <div className={cn('min-w-0', className)} role="img" aria-label={`Payment history. ${summarizeHistory(months)}`}>
      <div className={cn('grid grid-cols-12 items-end', lg ? 'h-20 gap-1 sm:h-24 sm:gap-[5px]' : 'h-5 gap-[2px]')}>
        {months.map((m) => (
          <div key={m.key} title={`${m.label}: ${m.note}`} className="flex h-full items-end">
            <div className={cn('w-full', fin[m.state])} />
          </div>
        ))}
      </div>
      {labels && (
        <div aria-hidden="true" className={cn('grid grid-cols-12 text-center text-quiet', lg ? 'mt-1.5 gap-1 text-[13px] sm:gap-[5px]' : 'mt-0.5 gap-[2px] text-[10.5px]')}>
          {months.map((m) => <span key={m.key}>{lg ? m.short : m.short[0]}</span>)}
        </div>
      )}
    </div>
  );
}

export function LouvreKey({ className }: { className?: string }) {
  const item = (cls: string, height: string, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-3.5 w-2.5 items-end" aria-hidden="true"><span className={cn('w-full', cls, height)} /></span>
      {text}
    </span>
  );
  return (
    <p className={cn('flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-quiet', className)}>
      {item('bg-paid', 'h-full', 'Paid on time')}
      {item('bg-paid', 'h-3/5', 'Paid late')}
      {item(LATE, 'h-full', 'Late now')}
      {item('border border-paid', 'h-full', 'Due')}
    </p>
  );
}
