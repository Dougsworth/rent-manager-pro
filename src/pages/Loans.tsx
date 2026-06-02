import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, createLoan, updateLoan, editLoan, deleteLoan, getLoanInstallments, getLoanStats } from '@/services/loans';
import { getLoanPaymentsForLoan } from '@/services/loanPayments';
import { createLoanPayment } from '@/services/loanPayments';
import { getBorrowers } from '@/services/borrowers';
import { createLoanSchema, editLoanSchema, createLoanPaymentSchema } from '@/schemas';
import type { LoanWithBorrower, Borrower, LoanInstallment, LoanDashboardStats } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Pagination, paginate } from '@/components/Pagination';
import { Search, Plus, Loader2, Landmark, DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Download, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { exportToCsv } from '@/utils/exportCsv';

type LoanStatus = 'all' | 'active' | 'paid_off' | 'defaulted';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function statusVariant(status: string) {
  if (status === 'paid' || status === 'paid_off') return 'paid' as const;
  if (status === 'pending' || status === 'active') return 'pending' as const;
  if (status === 'overdue' || status === 'defaulted') return 'overdue' as const;
  return 'default' as const;
}

function statusLabel(status: string) {
  if (status === 'paid_off') return 'Paid Off';
  if (status === 'defaulted') return 'Defaulted';
  if (status === 'active') return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Loans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [loanForm, setLoanForm] = useState({ borrower_id: '', principal: '', interest_rate: '0', term_months: '', start_date: '', notes: '' });
  const [formError, setFormError] = useState('');

  // Edit loan modal
  const [editingLoan, setEditingLoan] = useState<LoanWithBorrower | null>(null);
  const [editForm, setEditForm] = useState({ principal: '', interest_rate: '', term_months: '', start_date: '', notes: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

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

  const activeBorrowers = borrowers.filter(b => b.status === 'active');

  // Deep link from a borrower row: /loans?borrower=<id> opens the New Loan modal
  // with that borrower preselected. Guarded so it fires exactly once — otherwise
  // creating a loan refreshes `borrowers` and would re-trigger this, popping the
  // modal back open after a successful create.
  const deepLinkConsumed = useRef(false);
  useEffect(() => {
    if (deepLinkConsumed.current) return;
    const borrowerId = searchParams.get('borrower');
    if (!borrowerId) return;
    if (borrowers.length === 0) return; // wait until borrowers load to validate the id

    deepLinkConsumed.current = true;
    if (borrowers.some(b => b.id === borrowerId && b.status === 'active')) {
      setLoanForm(f => ({ ...f, borrower_id: borrowerId }));
      setShowCreate(true);
    }
    setSearchParams(prev => {
      prev.delete('borrower');
      return prev;
    }, { replace: true });
  }, [borrowers, searchParams, setSearchParams]);

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
    { value: 'paid_off' as LoanStatus, label: 'Paid Off', count: loans.filter(l => l.status === 'paid_off').length },
    { value: 'defaulted' as LoanStatus, label: 'Defaulted', count: loans.filter(l => l.status === 'defaulted').length },
  ];

  const handleCreateLoan = async () => {
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
      toast('Loan created successfully!');
      setShowCreate(false);
      setLoanForm({ borrower_id: '', principal: '', interest_rate: '0', term_months: '', start_date: '', notes: '' });
      await loadData();
    } catch (err) {
      setFormError('Failed to create loan');
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

  const handleRecordPayment = async () => {
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
      toast('Payment recorded!');
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
      setFormError('Failed to record payment');
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
    if (!confirm('Mark this loan as defaulted?')) return;
    try {
      await updateLoan(loanId, { status: 'defaulted' });
      toast('Loan marked as defaulted');
      await loadData();
    } catch (err) {
      toast('Failed to update loan', 'error');
    }
  };

  const openEditLoan = (loan: LoanWithBorrower) => {
    setEditingLoan(loan);
    setEditForm({
      principal: String(loan.principal),
      interest_rate: String(loan.interest_rate),
      term_months: String(loan.term_months),
      start_date: loan.start_date,
      notes: loan.notes ?? '',
    });
    setEditError('');
  };

  const editTermsLocked = (editingLoan?.total_paid ?? 0) > 0;

  const handleEditLoan = async () => {
    if (!editingLoan) return;
    setEditError('');
    const result = editLoanSchema.safeParse(editForm);
    if (!result.success) {
      setEditError(result.error.issues[0].message);
      return;
    }
    setSavingEdit(true);
    try {
      await editLoan(editingLoan.id, {
        principal: Number(editForm.principal),
        interest_rate: Number(editForm.interest_rate),
        term_months: Number(editForm.term_months),
        start_date: editForm.start_date,
        notes: editForm.notes || undefined,
      });
      toast(editTermsLocked ? 'Notes updated!' : 'Loan updated!');
      setEditingLoan(null);
      if (expandedLoanId === editingLoan.id) {
        const [inst, pay] = await Promise.all([
          getLoanInstallments(editingLoan.id),
          getLoanPaymentsForLoan(editingLoan.id),
        ]);
        setInstallments(inst);
        setLoanPayments(pay);
      }
      await loadData();
    } catch (err) {
      setEditError('Failed to update loan');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLoan = async (loan: LoanWithBorrower) => {
    if (!confirm(`Delete loan ${loan.loan_number}? This permanently removes its schedule and payment history.`)) return;
    try {
      await deleteLoan(loan.id);
      toast('Loan deleted');
      if (expandedLoanId === loan.id) setExpandedLoanId(null);
      await loadData();
    } catch (err) {
      toast('Failed to delete loan', 'error');
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

  const editPreviewTotal = !editTermsLocked && editForm.principal && editForm.interest_rate !== '' && editForm.term_months
    ? Math.round(Number(editForm.principal) * (1 + Number(editForm.interest_rate) / 100 * Number(editForm.term_months) / 12))
    : 0;
  const editPreviewMonthly = editPreviewTotal && Number(editForm.term_months)
    ? Math.round(editPreviewTotal / Number(editForm.term_months))
    : 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <PageHeader title="Loans" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-xl bg-white/60 animate-pulse" />)}
        </div>
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/60 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Loans"
        count={loans.length}
        action={
          <div className="flex gap-2">
            {loans.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            )}
            <Button size="sm" onClick={() => { setLoanForm({ borrower_id: '', principal: '', interest_rate: '0', term_months: '', start_date: '', notes: '' }); setFormError(''); setShowCreate(true); }}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Loan
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Lent" value={formatCurrency(stats.totalLent)} icon={Landmark} />
        <StatCard label="Collected" value={formatCurrency(stats.totalCollected)} icon={DollarSign} />
        <StatCard label="Outstanding" value={formatCurrency(stats.totalOutstanding)} icon={TrendingUp} />
        <StatCard label="Active Loans" value={String(stats.activeLoanCount)} icon={Landmark} />
        <StatCard label="Overdue" value={String(stats.overdueInstallments)} icon={AlertTriangle} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={(v) => { setActiveTab(v); setCurrentPage(1); }} />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search loans..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
      </div>

      {/* Loan List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Landmark}
          message="No loans yet"
          description="Create a loan to start tracking repayments"
          action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />New Loan</Button>}
        />
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map(loan => {
              const isExpanded = expandedLoanId === loan.id;
              const progress = loan.principal > 0 ? Math.min(100, Math.round((loan.total_paid / loan.principal) * 100)) : 0;

              return (
                <div key={loan.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                  {/* Loan Row */}
                  <SimpleTooltip label={isExpanded ? 'Hide details' : 'View schedule & payments'} side="top">
                  <button
                    onClick={() => toggleExpand(loan.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{loan.loan_number}</span>
                          <StatusBadge variant={statusVariant(loan.status)}>
                            {statusLabel(loan.status)}
                          </StatusBadge>
                        </div>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                          {loan.borrower_first_name} {loan.borrower_last_name}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-slate-400">Principal</p>
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(loan.principal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Monthly</p>
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(loan.monthly_installment)}</p>
                      </div>
                      <div className="w-24">
                        <p className="text-xs text-slate-400 mb-1">Paid {progress}%</p>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="ml-3">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>
                  </SimpleTooltip>

                  {/* Mobile stats */}
                  <div className="sm:hidden px-4 pb-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>{formatCurrency(loan.principal)}</span>
                    <span>{formatCurrency(loan.monthly_installment)}/mo</span>
                    <span>{progress}% paid</span>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                      {loadingDetail ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Loan Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-slate-400">Interest Rate</span><p className="font-medium">{loan.interest_rate}%</p></div>
                            <div><span className="text-slate-400">Term</span><p className="font-medium">{loan.term_months} months</p></div>
                            <div><span className="text-slate-400">Start</span><p className="font-medium">{formatDate(loan.start_date)}</p></div>
                            <div><span className="text-slate-400">End</span><p className="font-medium">{formatDate(loan.end_date)}</p></div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {loan.status === 'active' && (
                              <>
                                <Button size="sm" onClick={() => openPaymentModal(loan.id, loan.monthly_installment)}>
                                  <DollarSign className="h-4 w-4 mr-1" />Record Payment
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEditLoan(loan)}>
                                  <Pencil className="h-4 w-4 mr-1" />Edit
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleMarkDefaulted(loan.id)}>
                                  Mark Defaulted
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDeleteLoan(loan)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4 mr-1" />Delete
                            </Button>
                          </div>

                          {/* Installment Schedule */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Installment Schedule</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-slate-400 border-b border-slate-200/60">
                                    <th className="pb-2 font-medium">#</th>
                                    <th className="pb-2 font-medium">Due Date</th>
                                    <th className="pb-2 font-medium text-right">Amount</th>
                                    <th className="pb-2 font-medium text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installments.map(inst => {
                                    const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date();
                                    return (
                                      <tr key={inst.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 text-slate-600">{inst.installment_number}</td>
                                        <td className="py-2 text-slate-600">{formatDate(inst.due_date)}</td>
                                        <td className="py-2 text-right text-slate-900 font-medium">{formatCurrency(inst.amount)}</td>
                                        <td className="py-2 text-right">
                                          <StatusBadge variant={isOverdue ? 'overdue' : statusVariant(inst.status)}>
                                            {isOverdue ? 'Overdue' : statusLabel(inst.status)}
                                          </StatusBadge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Payment History */}
                          {loanPayments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-900 mb-2">Payment History</h4>
                              <div className="space-y-1.5">
                                {loanPayments.map(p => (
                                  <div key={p.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-slate-100">
                                    <div>
                                      <span className="text-xs font-mono text-slate-400 mr-2">{p.payment_number}</span>
                                      <span className="text-slate-600">{formatDate(p.payment_date)}</span>
                                    </div>
                                    <span className="font-medium text-slate-900">{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {loan.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-900 mb-1">Notes</h4>
                              <p className="text-sm text-slate-500">{loan.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Create Loan Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Loan</DialogTitle></DialogHeader>
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="space-y-4">
            <div>
              <Label>Borrower *</Label>
              {activeBorrowers.length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5">
                  No active borrowers yet.{' '}
                  <Link to="/borrowers" className="text-blue-600 font-medium hover:underline">
                    Add a borrower
                  </Link>{' '}
                  first.
                </p>
              ) : (
                <Select
                  value={loanForm.borrower_id}
                  onValueChange={(v: string) => setLoanForm(f => ({ ...f, borrower_id: v }))}
                  placeholder="Select borrower..."
                  options={activeBorrowers.map(b => ({
                    value: b.id,
                    label: `${b.first_name} ${b.last_name}`,
                  }))}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loan Amount (J$) *</Label>
                <Input type="number" value={loanForm.principal} onChange={e => setLoanForm(f => ({ ...f, principal: e.target.value }))} placeholder="e.g. 100000" />
              </div>
              <div>
                <Label>Interest Rate (% annual)</Label>
                <Input type="number" step="0.01" value={loanForm.interest_rate} onChange={e => setLoanForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Term (months) *</Label>
                <Input type="number" value={loanForm.term_months} onChange={e => setLoanForm(f => ({ ...f, term_months: e.target.value }))} placeholder="e.g. 12" />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={loanForm.start_date} onChange={e => setLoanForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={loanForm.notes} onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>

            {/* Preview */}
            {previewMonthly > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-blue-700"><span className="font-medium">Monthly Payment:</span> {formatCurrency(previewMonthly)}</p>
                <p className="text-blue-700"><span className="font-medium">Total Repayment:</span> {formatCurrency(previewTotal)}</p>
                <p className="text-blue-600 text-xs">Total interest: {formatCurrency(previewTotal - Number(loanForm.principal))}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreateLoan} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create Loan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Modal */}
      <Dialog open={!!editingLoan} onOpenChange={(open) => { if (!open) setEditingLoan(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Loan {editingLoan?.loan_number}</DialogTitle></DialogHeader>
          {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}
          {editTermsLocked && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
              Payments have been recorded, so the loan terms are locked. You can still edit the notes.
            </p>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loan Amount (J$) *</Label>
                <Input type="number" value={editForm.principal} disabled={editTermsLocked} onChange={e => setEditForm(f => ({ ...f, principal: e.target.value }))} />
              </div>
              <div>
                <Label>Interest Rate (% annual)</Label>
                <Input type="number" step="0.01" value={editForm.interest_rate} disabled={editTermsLocked} onChange={e => setEditForm(f => ({ ...f, interest_rate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Term (months) *</Label>
                <Input type="number" value={editForm.term_months} disabled={editTermsLocked} onChange={e => setEditForm(f => ({ ...f, term_months: e.target.value }))} />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={editForm.start_date} disabled={editTermsLocked} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>

            {editPreviewMonthly > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-blue-700"><span className="font-medium">New Monthly Payment:</span> {formatCurrency(editPreviewMonthly)}</p>
                <p className="text-blue-700"><span className="font-medium">New Total Repayment:</span> {formatCurrency(editPreviewTotal)}</p>
                <p className="text-blue-600 text-xs">Saving rebuilds the installment schedule.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingLoan(null)}>Cancel</Button>
              <Button onClick={handleEditLoan} disabled={savingEdit}>
                {savingEdit && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Loan Payment</DialogTitle></DialogHeader>
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="space-y-4">
            <div>
              <Label>Amount (J$) *</Label>
              <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Method</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(v: string) => setPaymentForm(f => ({ ...f, method: v }))}
                  options={[
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'card', label: 'Card' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={recording}>
                {recording && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
