import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { createPayment } from '@/services/payments';
import { createLoanPayment } from '@/services/loanPayments';
import { isoDate, type CollectionItem } from '@/services/collections';
import { formatMoney } from '@/lib/money';

type Method = 'bank_transfer' | 'cash' | 'card' | 'other';

const methods: { value: Method; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

interface QuickPaymentProps {
  landlordId: string;
  item: Pick<CollectionItem, 'key' | 'kind' | 'personId' | 'name' | 'amount' | 'invoiceId' | 'loanId'>;
  onDone: () => void;
  onCancel: () => void;
}

/** Record a payment in place. Amount and date are already filled in, Enter saves. */
export function QuickPayment({ landlordId, item, onDone, onCancel }: QuickPaymentProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(String(item.amount));
  const [method, setMethod] = useState<Method>('bank_transfer');
  const [date, setDate] = useState(isoDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) { setError('Enter the amount you received.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (item.kind === 'loan') {
        await createLoanPayment(landlordId, { loan_id: item.loanId!, amount: value, payment_date: date, method });
      } else {
        await createPayment(landlordId, { tenant_id: item.personId, invoice_id: item.invoiceId, amount: value, payment_date: date, method });
      }
      toast(`${formatMoney(value)} from ${item.name} recorded.`, 'success');
      onDone();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError('That payment did not save. Check your connection and try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }} className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-[150px_170px_160px_auto] sm:items-end">
      <div>
        <Label htmlFor={`${item.key}-amount`}>Amount received</Label>
        <Input id={`${item.key}-amount`} className="num mt-1" inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
      </div>
      <div>
        <Label htmlFor={`${item.key}-method`}>How</Label>
        <Select id={`${item.key}-method`} className="mt-1" value={method} onValueChange={(v) => setMethod(v as Method)} options={methods} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor={`${item.key}-date`}>Date</Label>
        <Input id={`${item.key}-date`} className="mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">{saving ? 'Saving' : 'Save'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      {error && <p role="alert" className="col-span-2 text-sm font-medium text-late sm:col-span-4">{error}</p>}
    </form>
  );
}
