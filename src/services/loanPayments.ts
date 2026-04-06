import { supabase } from '@/lib/supabase';
import { createNotification } from '@/services/notifications';
import { logActivity } from '@/services/activityLog';
import type { LoanPaymentWithDetails } from '@/types/app.types';

export async function getLoanPayments(landlordId: string): Promise<LoanPaymentWithDetails[]> {
  const { data, error } = await supabase
    .from('loan_payments')
    .select('*, loan:loans(loan_number, borrower:borrowers(first_name, last_name))')
    .eq('landlord_id', landlordId)
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((p): LoanPaymentWithDetails => {
    const loan = p.loan as any;
    const borrower = loan?.borrower as any;
    return {
      ...p,
      borrower_first_name: borrower?.first_name ?? '',
      borrower_last_name: borrower?.last_name ?? '',
      loan_number: loan?.loan_number ?? '',
    };
  });
}

export async function createLoanPayment(landlordId: string, payment: {
  loan_id: string;
  amount: number;
  payment_date?: string;
  method?: 'bank_transfer' | 'card' | 'cash' | 'other';
  notes?: string;
}) {
  // Find oldest pending installment for this loan to auto-link
  const { data: pendingInstallments } = await supabase
    .from('loan_installments')
    .select('id, amount')
    .eq('loan_id', payment.loan_id)
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(1);

  const installment = pendingInstallments?.[0];

  const { data, error } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: payment.loan_id,
      installment_id: installment?.id ?? null,
      landlord_id: landlordId,
      amount: payment.amount,
      payment_date: payment.payment_date ?? new Date().toISOString().split('T')[0],
      method: payment.method ?? 'bank_transfer',
      notes: payment.notes ?? '',
      payment_number: 'TEMP', // trigger will overwrite
    })
    .select()
    .single();

  if (error) throw error;

  // Mark installment as paid if auto-linked
  if (installment) {
    await supabase
      .from('loan_installments')
      .update({ status: 'paid' })
      .eq('id', installment.id);
  }

  // Update loan.total_paid and check if fully paid
  const { data: loan } = await supabase
    .from('loans')
    .select('total_paid, principal, borrower_id')
    .eq('id', payment.loan_id)
    .single();

  if (loan) {
    const newTotalPaid = (loan as any).total_paid + payment.amount;
    const updates: Record<string, unknown> = { total_paid: newTotalPaid };

    // Check if all installments are paid
    const { data: remaining } = await supabase
      .from('loan_installments')
      .select('id')
      .eq('loan_id', payment.loan_id)
      .in('status', ['pending', 'overdue'])
      .limit(1);

    if (!remaining || remaining.length === 0) {
      updates.status = 'paid_off';
    }

    await supabase
      .from('loans')
      .update(updates)
      .eq('id', payment.loan_id);

    // Get borrower name for notification
    const { data: borrower } = await supabase
      .from('borrowers')
      .select('first_name, last_name')
      .eq('id', (loan as any).borrower_id)
      .single();

    const borrowerName = borrower ? `${borrower.first_name} ${borrower.last_name}`.trim() : 'A borrower';

    createNotification(
      landlordId,
      'loan_payment_received',
      'Loan Payment Received',
      `${borrowerName} paid J$${payment.amount.toLocaleString()}`,
      (data as any).id,
    );

    logActivity(landlordId, 'loan_payment_created', 'loan_payment', `Recorded loan payment from ${borrowerName} — J$${payment.amount.toLocaleString()}`, (data as any).id, {
      amount: payment.amount,
      method: payment.method,
      loan_id: payment.loan_id,
    });
  }

  return data;
}

export async function getLoanPaymentsForLoan(loanId: string) {
  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
