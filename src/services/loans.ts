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

// Simple interest: total = principal * (1 + rate/100 * term/12).
function computeLoanTotals(principal: number, interestRate: number, termMonths: number) {
  const totalRepayment = Math.round(principal * (1 + (interestRate / 100) * (termMonths / 12)));
  const monthlyInstallment = Math.round(totalRepayment / termMonths);
  return { totalRepayment, monthlyInstallment };
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// Build the monthly installment rows, pushing any rounding remainder onto the last one.
function buildInstallments(
  loanId: string,
  landlordId: string,
  startDate: string,
  termMonths: number,
  monthlyInstallment: number,
  totalRepayment: number,
) {
  const installments = [];
  for (let i = 0; i < termMonths; i++) {
    installments.push({
      loan_id: loanId,
      landlord_id: landlordId,
      installment_number: i + 1,
      amount: monthlyInstallment,
      due_date: addMonths(startDate, i + 1), // first payment due one month after start
    });
  }
  if (installments.length > 0) {
    const sumSoFar = monthlyInstallment * (termMonths - 1);
    installments[installments.length - 1].amount = totalRepayment - sumSoFar;
  }
  return installments;
}

export async function createLoan(landlordId: string, loan: {
  borrower_id: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  notes?: string;
}) {
  const { totalRepayment, monthlyInstallment } = computeLoanTotals(loan.principal, loan.interest_rate, loan.term_months);
  const endDate = addMonths(loan.start_date, loan.term_months);

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

  const installments = buildInstallments(loanId, landlordId, loan.start_date, loan.term_months, monthlyInstallment, totalRepayment);

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

// Edit a loan's terms. Once any payment exists the schedule is locked, so only
// the notes are updated; otherwise the loan is recomputed and its schedule rebuilt.
export async function editLoan(loanId: string, updates: {
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  notes?: string;
}) {
  const { data: current, error: fetchErr } = await supabase
    .from('loans')
    .select('landlord_id, total_paid, loan_number')
    .eq('id', loanId)
    .single();

  if (fetchErr) throw fetchErr;

  const landlordId = (current as any).landlord_id;
  const loanNumber = (current as any).loan_number;
  const hasPayments = (current as any).total_paid > 0;

  if (hasPayments) {
    const { data, error } = await supabase
      .from('loans')
      .update({ notes: updates.notes ?? '' })
      .eq('id', loanId)
      .select()
      .single();

    if (error) throw error;

    logActivity(landlordId, 'loan_updated', 'loan', `Updated notes for loan ${loanNumber}`, loanId);
    return data;
  }

  const { totalRepayment, monthlyInstallment } = computeLoanTotals(updates.principal, updates.interest_rate, updates.term_months);
  const endDate = addMonths(updates.start_date, updates.term_months);

  const { data, error } = await supabase
    .from('loans')
    .update({
      principal: updates.principal,
      interest_rate: updates.interest_rate,
      term_months: updates.term_months,
      monthly_installment: monthlyInstallment,
      start_date: updates.start_date,
      end_date: endDate,
      notes: updates.notes ?? '',
    })
    .eq('id', loanId)
    .select()
    .single();

  if (error) throw error;

  // Replace the schedule with one matching the new terms.
  const { error: delErr } = await supabase.from('loan_installments').delete().eq('loan_id', loanId);
  if (delErr) throw delErr;

  const installments = buildInstallments(loanId, landlordId, updates.start_date, updates.term_months, monthlyInstallment, totalRepayment);
  const { error: instErr } = await supabase.from('loan_installments').insert(installments);
  if (instErr) throw instErr;

  logActivity(landlordId, 'loan_updated', 'loan', `Updated loan ${loanNumber}`, loanId, {
    principal: updates.principal,
    interest_rate: updates.interest_rate,
    term_months: updates.term_months,
  });

  return data;
}

// Delete a loan. Installments and payments cascade via FK ON DELETE CASCADE.
export async function deleteLoan(loanId: string) {
  const { error } = await supabase.from('loans').delete().eq('id', loanId);
  if (error) throw error;
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

  // Count anything past its due date that isn't paid — both installments the
  // cron has already flipped to 'overdue' and ones still 'pending' (not yet swept).
  const { data: overdueData } = await supabase
    .from('loan_installments')
    .select('id')
    .eq('landlord_id', landlordId)
    .in('status', ['pending', 'overdue'])
    .lt('due_date', new Date().toISOString().split('T')[0]);

  return {
    totalLent: rows.reduce((s, l) => s + l.principal, 0),
    totalCollected: rows.reduce((s, l) => s + l.total_paid, 0),
    totalOutstanding: rows.reduce((s, l) => s + Math.max(0, l.principal - l.total_paid), 0),
    activeLoanCount: rows.filter(l => l.status === 'active').length,
    overdueInstallments: overdueData?.length ?? 0,
  };
}
