import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, createLoan, updateLoan, getLoanInstallments, getLoanStats } from '@/services/loans';
import { getLoanPaymentsForLoan } from '@/services/loanPayments';
import { createLoanPayment } from '@/services/loanPayments';
import { getBorrowers } from '@/services/borrowers';
import { createLoanSchema, createLoanPaymentSchema } from '@/schemas';
import type { LoanWithBorrower, Borrower, LoanInstallment, LoanDashboardStats } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Pagination, paginate } from '@/components/Pagination';
import { Search, ChevronDown } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { exportToCsv } from '@/utils/exportCsv';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

type LoanStatus = 'all' | 'active' | 'paid_off' | 'defaulted';

function statusVariant(status: string) {
  if (status === 'paid' || status === 'paid_off') return 'paid' as const;
  if (status === 'pending' || status === 'active') return 'pending' as const;
  if (status === 'overdue' || status === 'defaulted') return 'overdue' as const;
  return 'default' as const;
}

function statusLabel(status: string) {
  if (status === 'paid_off') return 'Paid off';
  if (status === 'defaulted') return 'Defaulted';
  if (status === 'active') return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

const emptyLoan = { borrower_id: '', principal: '', interest_rate: '0', term_months: '', start_date: '', notes: '' };

/** Desktop columns. Below lg each loan stacks into two lines. */
const COLS = 'lg:grid-cols-[minmax(180px,1fr)_100px_120px_120px_minmax(170px,200px)_128px]';

export default function Loans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [stats, setStats] = useState<LoanDashboardStats>({ totalLent: 0, totalCollected: 0, totalOutstanding: 0, activeLoanCount: 0, overdueInstallments: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LoanStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Create loan modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loanForm, setLoanForm] = useState(emptyLoan);
  const [formError, setFormError] = useState('');

  // Loan detail expansion
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Record payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'bank_transfer', payment_date: '', notes: '' });
  const [recording, setRecording] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [loansData, borrowersData, statsData] = await Promise.all([
        getLoans(user.id),
        getBorrowers(user.id),
        getLoanStats(user.id),
      ]);
      setLoans(loansData);
      setBorrowers(borrowersData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const filtered = loans
    .filter(l => activeTab === 'all' || l.status === activeTab)
    .filter(l => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const name = `${l.borrower_first_name} ${l.borrower_last_name}`.toLowerCase();
      return name.includes(q) || l.loan_number.toLowerCase().includes(q);
    });

  const pageItems = paginate(filtered, currentPage, PAGE_SIZE);

  const tabs = [
    { value: 'all' as LoanStatus, label: 'All', count: loans.length },
    { value: 'active' as LoanStatus, label: 'Active', count: loans.filter(l => l.status === 'active').length },
    { value: 'paid_off' as LoanStatus, label: 'Paid off', count: loans.filter(l => l.status === 'paid_off').length },
    { value: 'defaulted' as LoanStatus, label: 'Defaulted', count: loans.filter(l => l.status === 'defaulted').length },
  ];

  const openCreate = () => { setLoanForm(emptyLoan); setFormError(''); setShowCreate(true); };

  const handleCreateLoan = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError('');
    const result = createLoanSchema.safeParse(loanForm);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    setCreating(true);
    try {
      await createLoan(user!.id, {
        borrower_id: loanForm.borrower_id,
        principal: Number(loanForm.principal),
        interest_rate: Number(loanForm.interest_rate),
        term_months: Number(loanForm.term_months),
        start_date: loanForm.start_date,
        notes: loanForm.notes || undefined,
      });
      toast('Loan created. Its repayment schedule is ready.', 'success');
      setShowCreate(false);
      setLoanForm(emptyLoan);
      await loadData();
    } catch (err) {
      setFormError('That loan did not save. Check your connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleExpand = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      return;
    }
    setExpandedLoanId(loanId);
    setLoadingDetail(true);
    try {
      const [inst, pay] = await Promise.all([
        getLoanInstallments(loanId),
        getLoanPaymentsForLoan(loanId),
      ]);
      setInstallments(inst);
      setLoanPayments(pay);
    } catch (err) {
      console.error('Failed to load loan details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openPaymentModal = (loanId: string, installmentAmount?: number) => {
    setPaymentLoanId(loanId);
    setPaymentForm({ amount: installmentAmount?.toString() ?? '', method: 'bank_transfer', payment_date: '', notes: '' });
    setFormError('');
    setShowPayment(true);
  };

  const handleRecordPayment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError('');
    const result = createLoanPaymentSchema.safeParse({ ...paymentForm, loan_id: paymentLoanId });
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    setRecording(true);
    try {
      await createLoanPayment(user!.id, {
        loan_id: paymentLoanId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method as any,
        payment_date: paymentForm.payment_date || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast(`${formatMoney(Number(paymentForm.amount))} recorded.`, 'success');
      setShowPayment(false);
      // Refresh detail if expanded
      if (expandedLoanId === paymentLoanId) {
        const [inst, pay] = await Promise.all([
          getLoanInstallments(paymentLoanId),
          getLoanPaymentsForLoan(paymentLoanId),
        ]);
        setInstallments(inst);
        setLoanPayments(pay);
      }
      await loadData();
    } catch (err) {
      setFormError('That payment did not save. Check your connection and try again.');
    } finally {
      setRecording(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'loan_number', header: 'Loan #' },
      { key: 'borrower', header: 'Borrower' },
      { key: 'principal', header: 'Principal' },
      { key: 'interest_rate', header: 'Interest Rate' },
      { key: 'term_months', header: 'Term (months)' },
      { key: 'monthly_installment', header: 'Monthly' },
      { key: 'total_paid', header: 'Total Paid' },
      { key: 'status', header: 'Status' },
      { key: 'start_date', header: 'Start Date' },
      { key: 'end_date', header: 'End Date' },
    ];
    const rows = filtered.map(l => ({
      loan_number: l.loan_number,
      borrower: `${l.borrower_first_name} ${l.borrower_last_name}`,
      principal: l.principal,
      interest_rate: `${l.interest_rate}%`,
      term_months: l.term_months,
      monthly_installment: l.monthly_installment,
      total_paid: l.total_paid,
      status: l.status,
      start_date: l.start_date,
      end_date: l.end_date,
    }));
    exportToCsv('loans-export', rows, columns);
  };

  const handleMarkDefaulted = async (loanId: string) => {
    if (!confirm('Mark this loan as defaulted? It stops counting as active.')) return;
    try {
      await updateLoan(loanId, { status: 'defaulted' });
      toast('Loan marked as defaulted.');
      await loadData();
    } catch (err) {
      toast('That loan was not updated. Try again.', 'error');
    }
  };

  // Calculate preview
  const previewMonthly = loanForm.principal && loanForm.interest_rate !== '' && loanForm.term_months
    ? Math.round(
        (Number(loanForm.principal) * (1 + Number(loanForm.interest_rate) / 100 * Number(loanForm.term_months) / 12)) / Number(loanForm.term_months)
      )
    : 0;
  const previewTotal = loanForm.principal && loanForm.interest_rate !== '' && loanForm.term_months
    ? Math.round(Number(loanForm.principal) * (1 + Number(loanForm.interest_rate) / 100 * Number(loanForm.term_months) / 12))
    : 0;

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading loans">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="mt-6 h-6 w-full max-w-xl" />
        <div className="mt-8 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-11 w-full" />)}</div>
      </div>
    );
  }

  const paymentLoan = loans.find(l => l.id === paymentLoanId);

  return (
    <>
      <PageHeader
        title="Loans"
        count={loans.length}
        description="Money you have lent, what has come back and what is still owed."
        action={<Button onClick={openCreate}>New loan</Button>}
      />

      {loans.length > 0 && (
        <p className="num mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-rule pb-5 text-base">
          <span><b className="text-[22px] font-bold">{formatMoney(stats.totalOutstanding)}</b> still owed to you</span>
          <span><b className="font-semibold">{formatMoney(stats.totalCollected)}</b> repaid of {formatMoney(stats.totalLent)} lent</span>
          <span>{stats.activeLoanCount} active {stats.activeLoanCount === 1 ? 'loan' : 'loans'}</span>
          <span>
            {stats.overdueInstallments > 0
              ? <b className="font-semibold text-late">{stats.overdueInstallments} {stats.overdueInstallments === 1 ? 'installment' : 'installments'} late</b>
              : <b className="font-semibold text-paid">Nothing late</b>}
          </span>
        </p>
      )}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="loan-search" className="sr-only">Search loans</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
          <Input id="loan-search" placeholder="Search by borrower or loan number" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
        {loans.length > 0 && <Button variant="ghost" onClick={handleExport} className="-ml-3.5 self-start sm:-mr-3.5 sm:ml-0 sm:self-auto">Export CSV</Button>}
      </div>

      <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={(v) => { setActiveTab(v); setCurrentPage(1); }} />

      {filtered.length === 0 ? (
        loans.length === 0 ? (
          <EmptyState
            message="No loans yet"
            description="Add a loan and EasyCollect builds the repayment schedule and tells you when a payment is late."
            action={<Button onClick={openCreate}>New loan</Button>}
          />
        ) : (
          <p className="py-8 text-[15px] text-quiet">No loans match. Try another name, number or tab.</p>
        )
      ) : (
        <>
          <div className="lg:overflow-x-auto">
            <div className="lg:min-w-[800px]">
              <div className={cn('hidden gap-x-4 py-2 text-[13.5px] text-quiet lg:grid', COLS)}>
                <span>Borrower</span>
                <span>Status</span>
                <span className="text-right">Lent</span>
                <span className="text-right">Each month</span>
                <span>Repaid</span>
                <span className="sr-only">Details</span>
              </div>
              <ul>
                {pageItems.map(loan => {
                  const isExpanded = expandedLoanId === loan.id;
                  const progress = loan.principal > 0 ? Math.min(100, Math.round((loan.total_paid / loan.principal) * 100)) : 0;
                  const detailId = `loan-detail-${loan.id}`;

                  return (
                    <li key={loan.id} className="border-t border-rule">
                      <div className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3', COLS)}>
                        <div className="min-w-0">
                          <Link to={`/borrowers/${loan.borrower_id}`} className={cn('block truncate text-base text-ink hover:underline', loan.status === 'defaulted' ? 'font-semibold' : 'font-medium')}>
                            {loan.borrower_first_name} {loan.borrower_last_name}
                          </Link>
                          <span className="num block text-[13.5px] text-quiet">{loan.loan_number}</span>
                        </div>

                        <span className="num text-right text-base font-semibold lg:order-3">{formatMoney(loan.principal)}</span>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px] text-quiet lg:contents lg:text-sm">
                          <StatusBadge variant={statusVariant(loan.status)} className="lg:order-2">{statusLabel(loan.status)}</StatusBadge>
                          <span className="num lg:order-4 lg:text-right lg:text-ink">{formatMoney(loan.monthly_installment)}<span className="lg:hidden"> a month</span></span>
                          <div className="flex items-center gap-2 lg:order-5">
                            <span className="num whitespace-nowrap lg:text-ink">{progress}% repaid</span>
                            <span aria-hidden="true" className="hidden h-[3px] min-w-12 flex-1 bg-rule lg:block">
                              <span className="block h-full bg-paid" style={{ width: `${progress}%` }} />
                            </span>
                          </div>
                        </div>

                        <div className="text-right lg:order-6">
                          <button
                            type="button"
                            onClick={() => toggleExpand(loan.id)}
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            className="inline-flex min-h-10 cursor-pointer items-center gap-1 whitespace-nowrap text-sm font-semibold text-shell hover:text-paid"
                          >
                            {isExpanded ? 'Hide schedule' : 'Schedule'}
                            <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-150', isExpanded && 'rotate-180')} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div id={detailId} className="pb-6 pt-1 lg:pl-0">
                          {loadingDetail ? (
                            <p className="py-4 text-[15px] text-quiet" aria-busy="true">Loading the schedule</p>
                          ) : (
                            <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
                              <div className="min-w-0">
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                                  <div><dt className="text-[13.5px] text-quiet">Interest</dt><dd className="num text-[15px]">{loan.interest_rate}% a year</dd></div>
                                  <div><dt className="text-[13.5px] text-quiet">Term</dt><dd className="num text-[15px]">{loan.term_months} months</dd></div>
                                  <div><dt className="text-[13.5px] text-quiet">Started</dt><dd className="num text-[15px]">{formatDate(loan.start_date)}</dd></div>
                                  <div><dt className="text-[13.5px] text-quiet">Ends</dt><dd className="num text-[15px]">{formatDate(loan.end_date)}</dd></div>
                                </dl>

                                {loan.status === 'active' && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <Button onClick={() => openPaymentModal(loan.id, loan.monthly_installment)}>Record payment</Button>
                                    <Button variant="ghost" className="text-late" onClick={() => handleMarkDefaulted(loan.id)}>Mark defaulted</Button>
                                  </div>
                                )}

                                <h3 className="mb-2 mt-6 text-[15px] font-semibold">Repayment schedule</h3>
                                {installments.length === 0 ? (
                                  <p className="border-t border-rule py-3 text-[15px] text-quiet">No installments yet.</p>
                                ) : (
                                  <ol>
                                    {installments.map(inst => {
                                      const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date();
                                      return (
                                        <li key={inst.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-rule py-2 text-[15px] sm:grid-cols-[28px_120px_minmax(0,1fr)_120px]">
                                          <span className="num text-quiet">{inst.installment_number}</span>
                                          <span className="num">{formatDate(inst.due_date)}</span>
                                          <span className="num text-right font-medium sm:order-4">{formatMoney(inst.amount)}</span>
                                          <StatusBadge variant={isOverdue ? 'overdue' : statusVariant(inst.status)} className="col-start-2 sm:col-start-auto">
                                            {isOverdue ? 'Late' : statusLabel(inst.status)}
                                          </StatusBadge>
                                        </li>
                                      );
                                    })}
                                  </ol>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h3 className="mb-2 text-[15px] font-semibold">Payments received</h3>
                                {loanPayments.length === 0 ? (
                                  <p className="border-t border-rule py-3 text-[15px] text-quiet">Nothing received yet.</p>
                                ) : (
                                  <ul>
                                    {loanPayments.map(p => (
                                      <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-t border-rule py-2 text-[15px]">
                                        <span className="num">{formatDate(p.payment_date)} <span className="text-[13.5px] text-quiet">{p.payment_number}</span></span>
                                        <span className="num font-medium">{formatMoney(p.amount)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {loan.notes && (
                                  <>
                                    <h3 className="mb-1 mt-6 text-[15px] font-semibold">Notes</h3>
                                    <p className="text-[15px] text-quiet">{loan.notes}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}

      {/* New loan */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New loan</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateLoan} className="space-y-4">
            {formError && <p role="alert" className="text-sm font-medium text-late">{formError}</p>}
            <div>
              <Label htmlFor="loan-borrower">Borrower</Label>
              <Select
                id="loan-borrower"
                className="mt-1"
                value={loanForm.borrower_id}
                onValueChange={(v: string) => setLoanForm(f => ({ ...f, borrower_id: v }))}
                placeholder="Choose a borrower"
                options={borrowers.filter(b => b.status === 'active').map(b => ({
                  value: b.id,
                  label: `${b.first_name} ${b.last_name}`,
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="loan-principal">Amount lent (J$)</Label>
                <Input id="loan-principal" className="num mt-1" type="number" inputMode="numeric" value={loanForm.principal} onChange={e => setLoanForm(f => ({ ...f, principal: e.target.value }))} placeholder="100000" />
              </div>
              <div>
                <Label htmlFor="loan-rate">Interest, % a year</Label>
                <Input id="loan-rate" className="num mt-1" type="number" step="0.01" value={loanForm.interest_rate} onChange={e => setLoanForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="loan-term">Months to repay</Label>
                <Input id="loan-term" className="num mt-1" type="number" inputMode="numeric" value={loanForm.term_months} onChange={e => setLoanForm(f => ({ ...f, term_months: e.target.value }))} placeholder="12" />
              </div>
              <div>
                <Label htmlFor="loan-start">Start date</Label>
                <Input id="loan-start" className="mt-1" type="date" value={loanForm.start_date} onChange={e => setLoanForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="loan-notes">Notes</Label>
              <Input id="loan-notes" className="mt-1" value={loanForm.notes} onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>

            {previewMonthly > 0 && (
              <dl className="num grid grid-cols-3 gap-3 border-t border-rule pt-3 text-[15px]">
                <div><dt className="text-[13.5px] text-quiet">Each month</dt><dd className="font-semibold">{formatMoney(previewMonthly)}</dd></div>
                <div><dt className="text-[13.5px] text-quiet">Repaid in total</dt><dd>{formatMoney(previewTotal)}</dd></div>
                <div><dt className="text-[13.5px] text-quiet">Interest</dt><dd>{formatMoney(previewTotal - Number(loanForm.principal))}</dd></div>
              </dl>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating' : 'Create loan'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record a loan payment */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a loan payment</DialogTitle>
            {paymentLoan && (
              <p className="mt-1 text-[15px] text-quiet">
                {paymentLoan.borrower_first_name} {paymentLoan.borrower_last_name}, <span className="num">{paymentLoan.loan_number}</span>
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {formError && <p role="alert" className="text-sm font-medium text-late">{formError}</p>}
            <div>
              <Label htmlFor="loanpay-amount">Amount received (J$)</Label>
              <Input id="loanpay-amount" className="num mt-1" type="number" inputMode="numeric" autoFocus value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="loanpay-method">How they paid</Label>
                <Select
                  id="loanpay-method"
                  className="mt-1"
                  value={paymentForm.method}
                  onValueChange={(v: string) => setPaymentForm(f => ({ ...f, method: v }))}
                  options={[
                    { value: 'bank_transfer', label: 'Bank transfer' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'card', label: 'Card' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="loanpay-date">Date paid</Label>
                <Input id="loanpay-date" className="mt-1" type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="loanpay-notes">Note</Label>
              <Input id="loanpay-notes" className="mt-1" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowPayment(false)}>Cancel</Button>
              <Button type="submit" disabled={recording}>{recording ? 'Saving' : 'Save payment'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
