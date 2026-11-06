import { supabase } from '@/lib/supabase';
import { buildHistory, isoDate, type HistoryMonth } from '@/services/collections';

export interface TimelineEntry {
  date: string;
  text: string;
}

export interface OpenCharge {
  key: string;
  label: string;
  amount: number;
  dueDate: string;
  invoiceId?: string;
  paymentToken?: string;
  loanId?: string;
}

export interface Ledger {
  history: HistoryMonth[];
  timeline: TimelineEntry[];
  open: OpenCharge[];
}

const methodWords: Record<string, string> = { bank_transfer: 'by bank transfer', cash: 'in cash', card: 'by card', other: '' };
const money = (n: number) => `J$${Math.round(Number(n)).toLocaleString('en-JM')}`;

export async function getTenantLedger(tenantId: string): Promise<Ledger & { tenant: any }> {
  const [tenantRes, invoiceRes, paymentRes, proofRes] = await Promise.all([
    supabase.from('tenants').select('*, unit:units(name, rent_amount, property:properties(name, address))').eq('id', tenantId).single(),
    supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('due_date', { ascending: false }),
    supabase.from('payments').select('*').eq('tenant_id', tenantId).order('payment_date', { ascending: false }),
    supabase.from('payment_proofs').select('id, invoice_id, status, created_at').eq('tenant_id', tenantId),
  ]);
  if (tenantRes.error) throw tenantRes.error;
  const invoices = (invoiceRes.data ?? []) as any[];
  const payments = (paymentRes.data ?? []) as any[];
  const proofs = (proofRes.data ?? []) as any[];

  const paidOn = new Map<string, string>();
  for (const p of payments) if (p.invoice_id && p.status !== 'failed') paidOn.set(p.invoice_id, p.payment_date);

  const timeline: TimelineEntry[] = [
    ...invoices.map((i) => ({ date: i.issue_date || i.created_at, text: `${i.description || 'Invoice'} sent, ${money(i.amount)}` })),
    ...payments.filter((p) => p.status !== 'failed').map((p) => ({ date: p.payment_date, text: `Paid ${money(p.amount)} ${methodWords[p.method] ?? ''}`.trim() })),
    ...proofs.map((p) => ({ date: p.created_at, text: p.status === 'approved' ? 'Proof of payment approved' : p.status === 'rejected' ? 'Proof of payment rejected' : 'Proof of payment sent for review' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return {
    tenant: tenantRes.data,
    history: buildHistory(invoices.map((i) => ({ dueDate: i.due_date, paid: i.status === 'paid', paidDate: paidOn.get(i.id) }))),
    timeline,
    open: invoices.filter((i) => i.status !== 'paid').sort((a, b) => a.due_date.localeCompare(b.due_date)).map((i) => ({
      key: `invoice-${i.id}`, label: i.description || i.invoice_number, amount: Number(i.amount), dueDate: i.due_date, invoiceId: i.id, paymentToken: i.payment_token,
    })),
  };
}

export async function getBorrowerLedger(borrowerId: string): Promise<Ledger & { borrower: any; loans: any[] }> {
  const [borrowerRes, loanRes] = await Promise.all([
    supabase.from('borrowers').select('*').eq('id', borrowerId).single(),
    supabase.from('loans').select('*').eq('borrower_id', borrowerId).order('start_date', { ascending: false }),
  ]);
  if (borrowerRes.error) throw borrowerRes.error;
  const loans = (loanRes.data ?? []) as any[];
  const ids = loans.map((l) => l.id);
  const [instRes, payRes] = ids.length
    ? await Promise.all([
        supabase.from('loan_installments').select('*').in('loan_id', ids).order('due_date', { ascending: true }),
        supabase.from('loan_payments').select('*').in('loan_id', ids).order('payment_date', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const installments = (instRes.data ?? []) as any[];
  const payments = (payRes.data ?? []) as any[];

  const paidOn = new Map<string, string>();
  for (const p of payments) if (p.installment_id) paidOn.set(p.installment_id, p.payment_date);
  const today = isoDate(new Date());

  const timeline: TimelineEntry[] = [
    ...loans.map((l) => ({ date: l.start_date, text: `Lent ${money(l.principal)}, ${l.loan_number}` })),
    ...payments.map((p) => ({ date: p.payment_date, text: `Paid ${money(p.amount)} ${methodWords[p.method] ?? ''}`.trim() })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  const unpaid = installments.filter((i) => i.status !== 'paid');
  const open = [
    ...unpaid.filter((i) => i.due_date < today),
    ...unpaid.filter((i) => i.due_date >= today).filter((i, idx, arr) => arr.findIndex((x) => x.loan_id === i.loan_id) === idx),
  ].map((i) => {
    const loan = loans.find((l) => l.id === i.loan_id);
    return { key: `installment-${i.id}`, label: `Payment ${i.installment_number} of ${loan?.term_months ?? ''}`.trim(), amount: Number(i.amount), dueDate: i.due_date, loanId: i.loan_id };
  });

  return {
    borrower: borrowerRes.data,
    loans,
    history: buildHistory(installments.map((i) => ({ dueDate: i.due_date, paid: i.status === 'paid', paidDate: paidOn.get(i.id) }))),
    timeline,
    open,
  };
}
