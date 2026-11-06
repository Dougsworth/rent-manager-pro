import { supabase } from '@/lib/supabase';

export type HistoryState = 'paid' | 'paid-late' | 'late' | 'due' | 'none';

export interface HistoryMonth {
  key: string;
  label: string;
  short: string;
  state: HistoryState;
  note: string;
}

export interface HistoryRecord {
  dueDate: string;
  paid: boolean;
  paidDate?: string | null;
}

export interface CollectionItem {
  key: string;
  kind: 'rent' | 'loan';
  personId: string;
  name: string;
  what: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  daysUntilDue: number;
  history: HistoryMonth[];
  invoiceId?: string;
  paymentToken?: string;
  loanId?: string;
  email?: string;
}

export interface CollectionsSummary {
  owed: number;
  late: number;
  comingUp: number;
  collected: number;
  lateCount: number;
  items: CollectionItem[];
  recent: { id: string; name: string; amount: number; date: string }[];
  isEmpty: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: string) => d.slice(0, 7);

/** Whole days between two YYYY-MM-DD dates, in local time. */
function dayDiff(from: string, to: string): number {
  const [a, b] = [from, to].map((s) => {
    const [y, m, day] = s.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  });
  return Math.round((b - a) / 86_400_000);
}

const shortDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Twelve calendar months ending this month, worst state wins within a month. */
export function buildHistory(records: HistoryRecord[], now = new Date()): HistoryMonth[] {
  const today = isoDate(now);
  const rank: Record<HistoryState, number> = { none: 0, paid: 1, 'paid-late': 2, due: 3, late: 4 };
  const months: HistoryMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const short = d.toLocaleDateString('en-US', { month: 'short' });
    let state: HistoryState = 'none';
    let note = 'Nothing billed';
    for (const r of records.filter((x) => monthKey(x.dueDate) === key)) {
      let s: HistoryState;
      let n: string;
      if (r.paid) {
        const lateBy = r.paidDate ? dayDiff(r.dueDate, r.paidDate) : 0;
        s = lateBy > 0 ? 'paid-late' : 'paid';
        n = lateBy > 0 ? `Paid late, ${shortDate(r.paidDate!)}` : r.paidDate ? `Paid ${shortDate(r.paidDate)}` : 'Paid';
      } else if (r.dueDate.slice(0, 10) < today) {
        s = 'late';
        n = `Unpaid, ${dayDiff(r.dueDate, today)} days late`;
      } else {
        s = 'due';
        n = `Due ${shortDate(r.dueDate)}`;
      }
      if (rank[s] >= rank[state]) { state = s; note = n; }
    }
    months.push({ key, label, short, state, note });
  }
  return months;
}

/** A plain sentence, used on screen and read by screen readers. */
export function summarizeHistory(months: HistoryMonth[]): string {
  const billed = months.filter((m) => m.state !== 'none' && m.state !== 'due').length;
  const paid = months.filter((m) => m.state === 'paid' || m.state === 'paid-late').length;
  const late = months.filter((m) => m.state === 'paid-late').length;
  if (billed === 0) return 'No payment history yet.';
  const base = `Paid ${paid} of the last ${billed} ${billed === 1 ? 'month' : 'months'}.`;
  if (late === 0) return `${base} None were late.`;
  return `${base} ${late} ${late === 1 ? 'was' : 'were'} late.`;
}

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    out.set(k, [...(out.get(k) ?? []), r]);
  }
  return out;
}

/**
 * The money owed, in the order you should act on it: most late first, then what
 * is coming up soonest. Pulled from invoices and loan installments together.
 */
export async function getCollections(landlordId: string, now = new Date()): Promise<CollectionsSummary> {
  const today = isoDate(now);
  const since = isoDate(new Date(now.getFullYear(), now.getMonth() - 11, 1));
  const monthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const [invoiceRes, paymentRes, installmentRes, loanPaymentRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, tenant_id, amount, due_date, status, payment_token, tenant:tenants(first_name, last_name, email, unit:units(name, property:properties(name)))')
      .eq('landlord_id', landlordId)
      .or(`due_date.gte.${since},status.neq.paid`),
    supabase
      .from('payments')
      .select('id, invoice_id, amount, payment_date, status, tenant:tenants(first_name, last_name)')
      .eq('landlord_id', landlordId)
      .gte('payment_date', since)
      .order('payment_date', { ascending: false }),
    supabase
      .from('loan_installments')
      .select('id, loan_id, installment_number, amount, due_date, status, loan:loans(id, status, term_months, borrower_id, borrower:borrowers(first_name, last_name))')
      .eq('landlord_id', landlordId)
      .or(`due_date.gte.${since},status.neq.paid`),
    supabase
      .from('loan_payments')
      .select('id, installment_id, amount, payment_date, loan:loans(borrower:borrowers(first_name, last_name))')
      .eq('landlord_id', landlordId)
      .gte('payment_date', since)
      .order('payment_date', { ascending: false }),
  ]);
  for (const r of [invoiceRes, paymentRes, installmentRes, loanPaymentRes]) if (r.error) throw r.error;

  const invoices = (invoiceRes.data ?? []) as any[];
  const payments = (paymentRes.data ?? []) as any[];
  const installments = ((installmentRes.data ?? []) as any[]).filter((i) => i.loan?.status !== 'paid_off');
  const loanPayments = (loanPaymentRes.data ?? []) as any[];

  const paidOnByInvoice = new Map<string, string>();
  for (const p of payments) if (p.invoice_id && p.status !== 'failed') paidOnByInvoice.set(p.invoice_id, p.payment_date);
  const paidOnByInstallment = new Map<string, string>();
  for (const p of loanPayments) if (p.installment_id) paidOnByInstallment.set(p.installment_id, p.payment_date);

  const tenantHistory = new Map<string, HistoryMonth[]>();
  for (const [id, rows] of groupBy(invoices, (i) => i.tenant_id)) {
    tenantHistory.set(id, buildHistory(rows.map((i) => ({ dueDate: i.due_date, paid: i.status === 'paid', paidDate: paidOnByInvoice.get(i.id) })), now));
  }
  const loanHistory = new Map<string, HistoryMonth[]>();
  for (const [id, rows] of groupBy(installments, (i) => i.loan_id)) {
    loanHistory.set(id, buildHistory(rows.map((i) => ({ dueDate: i.due_date, paid: i.status === 'paid', paidDate: paidOnByInstallment.get(i.id) })), now));
  }

  const timing = (due: string) => {
    const diff = dayDiff(due, today);
    return { daysLate: Math.max(0, diff), daysUntilDue: Math.max(0, -diff) };
  };

  const rentItems: CollectionItem[] = invoices.filter((i) => i.status !== 'paid').map((i) => {
    const place = [i.tenant?.unit?.name, i.tenant?.unit?.property?.name].filter(Boolean).join(', ');
    return {
      key: `invoice-${i.id}`,
      kind: 'rent',
      personId: i.tenant_id,
      name: `${i.tenant?.first_name ?? ''} ${i.tenant?.last_name ?? ''}`.trim(),
      what: place || 'Rent',
      amount: Number(i.amount),
      dueDate: i.due_date,
      ...timing(i.due_date),
      history: tenantHistory.get(i.tenant_id) ?? [],
      invoiceId: i.id,
      paymentToken: i.payment_token,
      email: i.tenant?.email,
    };
  });

  const loanItems: CollectionItem[] = installments.filter((i) => i.status !== 'paid' && i.loan?.status !== 'defaulted').map((i) => ({
    key: `installment-${i.id}`,
    kind: 'loan',
    personId: i.loan?.borrower_id,
    name: `${i.loan?.borrower?.first_name ?? ''} ${i.loan?.borrower?.last_name ?? ''}`.trim(),
    what: `Personal loan, payment ${i.installment_number} of ${i.loan?.term_months ?? ''}`.trim(),
    amount: Number(i.amount),
    dueDate: i.due_date,
    ...timing(i.due_date),
    history: loanHistory.get(i.loan_id) ?? [],
    loanId: i.loan_id,
  }));

  // Loan schedules can run for years. Only the next one per loan is owed right now.
  const nextByLoan = new Map<string, CollectionItem>();
  const loanOwed: CollectionItem[] = [];
  const lateLoans = new Set(loanItems.filter((i) => i.daysLate > 0).map((i) => i.loanId));
  for (const item of [...loanItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
    if (item.daysLate > 0) loanOwed.push(item);
    else if (!lateLoans.has(item.loanId) && !nextByLoan.has(item.loanId!)) { nextByLoan.set(item.loanId!, item); loanOwed.push(item); }
  }

  const items = [...rentItems, ...loanOwed].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const lateItems = items.filter((i) => i.daysLate > 0);
  const late = lateItems.reduce((s, i) => s + i.amount, 0);
  const owed = items.reduce((s, i) => s + i.amount, 0);

  const thisMonth = (d: string) => d >= monthStart && d.slice(0, 10) <= today;
  const collected =
    payments.filter((p) => p.status !== 'failed' && thisMonth(p.payment_date)).reduce((s, p) => s + Number(p.amount), 0) +
    loanPayments.filter((p) => thisMonth(p.payment_date)).reduce((s, p) => s + Number(p.amount), 0);

  const recent = [
    ...payments.filter((p) => p.status !== 'failed').map((p) => ({ id: p.id, name: `${p.tenant?.first_name ?? ''} ${p.tenant?.last_name ?? ''}`.trim(), amount: Number(p.amount), date: p.payment_date })),
    ...loanPayments.map((p) => ({ id: p.id, name: `${p.loan?.borrower?.first_name ?? ''} ${p.loan?.borrower?.last_name ?? ''}`.trim(), amount: Number(p.amount), date: p.payment_date })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return {
    owed,
    late,
    comingUp: owed - late,
    collected,
    lateCount: new Set(lateItems.map((i) => i.personId)).size,
    items,
    recent,
    isEmpty: invoices.length === 0 && installments.length === 0 && payments.length === 0,
  };
}
