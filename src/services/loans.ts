import { supabase } from '@/lib/supabase';
import { logActivity } from '@/services/activityLog';
import type { LoanWithBorrower, LoanInstallment, LoanDashboardStats } from '@/types/app.types';

export async function getLoans(landlordId: string): Promise<LoanWithBorrower[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*, borrower:borrowers(first_name, last_name)')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((l): LoanWithBorrower => {
    const borrower = l.borrower as any;
    return {
      ...l,
      borrower_first_name: borrower?.first_name ?? '',
      borrower_last_name: borrower?.last_name ?? '',
    };
  });
}

export async function getLoan(loanId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('*, borrower:borrowers(first_name, last_name, email, phone)')
    .eq('id', loanId)
    .single();

  if (error) throw error;
  return data;
}

export async function createLoan(landlordId: string, loan: {
  borrower_id: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  notes?: string;
}) {
  // Calculate simple interest: total = principal * (1 + rate/100 * term/12)
  const totalRepayment = Math.round(
    loan.principal * (1 + (loan.interest_rate / 100) * (loan.term_months / 12))
  );
  const monthlyInstallment = Math.round(totalRepayment / loan.term_months);

  // Calculate end date
  const start = new Date(loan.start_date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + loan.term_months);
  const endDate = end.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('loans')
    .insert({
      landlord_id: landlordId,
      borrower_id: loan.borrower_id,
      principal: loan.principal,
      interest_rate: loan.interest_rate,
      term_months: loan.term_months,
      monthly_installment: monthlyInstallment,
      start_date: loan.start_date,
      end_date: endDate,
      loan_number: 'TEMP', // trigger will overwrite
      notes: loan.notes ?? '',
    })
    .select()
    .single();

  if (error) throw error;

  const loanId = (data as any).id;

  // Generate installment rows
  const installments = [];
  for (let i = 0; i < loan.term_months; i++) {
    const dueDate = new Date(loan.start_date);
    dueDate.setMonth(dueDate.getMonth() + i + 1); // first payment due one month after start
    installments.push({
      loan_id: loanId,
      landlord_id: landlordId,
      installment_number: i + 1,
      amount: monthlyInstallment,
      due_date: dueDate.toISOString().split('T')[0],
    });
  }

  // Adjust last installment to account for rounding
  if (installments.length > 0) {
    const sumSoFar = monthlyInstallment * (loan.term_months - 1);
    installments[installments.length - 1].amount = totalRepayment - sumSoFar;
  }

  const { error: installError } = await supabase
    .from('loan_installments')
    .insert(installments);

  if (installError) throw installError;

  // Get borrower name for logging
  const { data: borrower } = await supabase
    .from('borrowers')
    .select('first_name, last_name')
    .eq('id', loan.borrower_id)
    .single();

  const borrowerName = borrower ? `${borrower.first_name} ${borrower.last_name}`.trim() : 'Unknown';
  logActivity(landlordId, 'loan_created', 'loan', `Created loan for ${borrowerName} — J$${loan.principal.toLocaleString()}`, loanId, {
    principal: loan.principal,
    interest_rate: loan.interest_rate,
    term_months: loan.term_months,
  });

  return data;
}

export async function updateLoan(loanId: string, updates: {
  status?: 'active' | 'paid_off' | 'defaulted';
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', loanId)
    .select()
    .single();

  if (error) throw error;

  logActivity((data as any).landlord_id, 'loan_updated', 'loan', `Updated loan ${(data as any).loan_number}`, loanId, updates);

  return data;
}

export async function getLoanInstallments(loanId: string): Promise<LoanInstallment[]> {
  const { data, error } = await supabase
    .from('loan_installments')
    .select('*')
    .eq('loan_id', loanId)
    .order('due_date');

  if (error) throw error;
  return (data ?? []) as LoanInstallment[];
}

export async function getLoanStats(landlordId: string): Promise<LoanDashboardStats> {
  const { data: loans, error } = await supabase
    .from('loans')
    .select('principal, total_paid, status')
    .eq('landlord_id', landlordId);

  if (error) throw error;

  const rows = (loans ?? []) as any[];

  const { data: overdueData } = await supabase
    .from('loan_installments')
    .select('id')
    .eq('landlord_id', landlordId)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString().split('T')[0]);

  return {
    totalLent: rows.reduce((s, l) => s + l.principal, 0),
    totalCollected: rows.reduce((s, l) => s + l.total_paid, 0),
    totalOutstanding: rows.reduce((s, l) => s + Math.max(0, l.principal - l.total_paid), 0),
    activeLoanCount: rows.filter(l => l.status === 'active').length,
    overdueInstallments: overdueData?.length ?? 0,
  };
}
