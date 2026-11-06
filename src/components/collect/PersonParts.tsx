import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { PaymentLouvre, LouvreKey } from './PaymentLouvre';
import { QuickPayment } from './QuickPayment';
import { ReminderButton } from './ReminderButton';
import { summarizeHistory, isoDate } from '@/services/collections';
import type { Ledger, OpenCharge } from '@/services/ledger';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/utils/formatDate';

export function owedLine(open: OpenCharge[]): { text: string; late: boolean } {
  if (open.length === 0) return { text: 'Paid up. Nothing owed right now.', late: false };
  const today = isoDate(new Date());
  const total = open.reduce((s, c) => s + c.amount, 0);
  const oldest = open[0];
  const days = Math.round((Date.parse(today) - Date.parse(oldest.dueDate)) / 86_400_000);
  if (days > 0) return { text: `Owes ${formatMoney(total)}, ${days} ${days === 1 ? 'day' : 'days'} late.`, late: true };
  return { text: `${formatMoney(total)} due ${formatDate(oldest.dueDate)}.`, late: false };
}

interface ActionsProps {
  landlordId: string;
  personId: string;
  name: string;
  kind: 'rent' | 'loan';
  open: OpenCharge[];
  onChanged: () => void;
}

/** The three things you do to a person who owes you, in order of use. */
export function PersonActions({ landlordId, personId, name, kind, open, onChanged }: ActionsProps) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const first = open[0];
  const isLate = !!first && first.dueDate < isoDate(new Date());

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${first!.paymentToken}`);
      toast('Pay link copied. Paste it in WhatsApp or an email.', 'success');
    } catch {
      toast('Could not copy the link.', 'error');
    }
  };

  if (!first) return null;
  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap gap-2">
        {kind === 'rent' && isLate && <ReminderButton tenantId={personId} invoiceId={first.invoiceId} />}
        <Button variant={kind === 'rent' && isLate ? 'outline' : 'default'} onClick={() => setPaying((v) => !v)} aria-expanded={paying}>Record payment</Button>
        {kind === 'rent' && first.paymentToken && <Button variant="outline" onClick={copy}>Copy pay link</Button>}
      </div>
      {paying && (
        <QuickPayment
          landlordId={landlordId}
          item={{ key: first.key, kind, personId, name, amount: first.amount, invoiceId: first.invoiceId, loanId: first.loanId }}
          onCancel={() => setPaying(false)}
          onDone={() => { setPaying(false); onChanged(); }}
        />
      )}
    </div>
  );
}

export function HistorySection({ ledger }: { ledger: Ledger }) {
  return (
    <section>
      <h2 className="mb-1 text-base font-semibold">Payment history</h2>
      <p className="mb-4 text-base">{summarizeHistory(ledger.history)}</p>
      <div className="overflow-x-auto"><PaymentLouvre months={ledger.history} size="lg" className="min-w-[300px]" /></div>
      <LouvreKey className="mt-3" />
    </section>
  );
}

export function Timeline({ entries }: { entries: Ledger['timeline'] }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">Timeline</h2>
      {entries.length === 0 ? <p className="border-t border-rule py-3 text-quiet">Nothing has happened yet.</p> : (
        <ol>
          {entries.map((e, i) => (
            <li key={i} className="grid grid-cols-[64px_1fr] gap-3 border-t border-rule py-2.5 text-[15px]">
              <span className="num text-quiet">{formatDate(e.date).replace(/, \d{4}$/, '')}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}><dt className="text-[13.5px] text-quiet">{k}</dt><dd className="text-[15px]">{v || 'Not set'}</dd></div>
      ))}
    </dl>
  );
}
