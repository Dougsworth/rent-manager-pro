import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBorrower } from '@/services/borrowers';
import { getLoans } from '@/services/loans';
import { getLoanPayments } from '@/services/loanPayments';
import type { Borrower, LoanWithBorrower, LoanPaymentWithDetails } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { AvatarInitial } from '@/components/ui/avatar-initial';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeft, Landmark, Plus, Mail, Phone, DollarSign, TrendingUp } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function loanStatusLabel(status: string) {
  if (status === 'paid_off') return 'Paid Off';
  if (status === 'defaulted') return 'Defaulted';
  return 'Active';
}
function loanStatusVariant(status: string) {
  if (status === 'paid_off') return 'paid' as const;
  if (status === 'defaulted') return 'overdue' as const;
  return 'pending' as const;
}

export default function BorrowerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [payments, setPayments] = useState<LoanPaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [b, allLoans, allPayments] = await Promise.all([
          getBorrower(id),
          getLoans(user.id),
          getLoanPayments(user.id),
        ]);
        setBorrower(b);
        const theirLoans = allLoans.filter((l) => l.borrower_id === id);
        setLoans(theirLoans);
        const loanIds = new Set(theirLoans.map((l) => l.id));
        setPayments(allPayments.filter((p) => loanIds.has(p.loan_id)));
      } catch (err) {
        console.error('Failed to load borrower:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, id]);

  const totalBorrowed = loans.reduce((s, l) => s + l.principal, 0);
  const totalRepaid = loans.reduce((s, l) => s + l.total_paid, 0);
  const totalOutstanding = loans.reduce((s, l) => s + Math.max(0, l.principal - l.total_paid), 0);
  const activeLoans = loans.filter((l) => l.status === 'active').length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="h-8 w-40 rounded-lg bg-white/60 animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-white/60 animate-pulse" />)}
        </div>
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/60 animate-pulse" />)}</div>
      </div>
    );
  }

  if (notFound || !borrower) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Button variant="outline" size="sm" onClick={() => navigate('/borrowers')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Borrowers
        </Button>
        <EmptyState icon={Landmark} message="Borrower not found" description="This borrower may have been deleted." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => navigate('/borrowers')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Borrowers
      </Button>

      <PageHeader
        title={`${borrower.first_name} ${borrower.last_name}`}
        action={
          <Button size="sm" onClick={() => navigate(`/loans?borrower=${borrower.id}`)} disabled={borrower.status !== 'active'}>
            <Plus className="h-4 w-4 mr-1.5" /> New Loan
          </Button>
        }
      />

      {/* Borrower card */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-6 flex items-center gap-4">
        <AvatarInitial name={`${borrower.first_name} ${borrower.last_name}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge variant={borrower.status === 'active' ? 'paid' : 'default'}>
              {borrower.status === 'active' ? 'Active' : 'Inactive'}
            </StatusBadge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {borrower.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{borrower.email}</span>}
            {borrower.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{borrower.phone}</span>}
            {!borrower.email && !borrower.phone && <span>No contact info</span>}
          </div>
          {borrower.notes && <p className="text-sm text-slate-500 mt-2">{borrower.notes}</p>}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Borrowed" value={formatCurrency(totalBorrowed)} icon={Landmark} />
        <StatCard label="Repaid" value={formatCurrency(totalRepaid)} icon={DollarSign} />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={TrendingUp} />
        <StatCard label="Active Loans" value={String(activeLoans)} icon={Landmark} />
      </div>

      {/* Loans */}
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Loans</h2>
      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          message="No loans yet"
          description="This borrower has no loans on record."
          action={borrower.status === 'active'
            ? <Button size="sm" onClick={() => navigate(`/loans?borrower=${borrower.id}`)}><Plus className="h-4 w-4 mr-1.5" />New Loan</Button>
            : undefined}
        />
      ) : (
        <div className="space-y-2 mb-8">
          {loans.map((loan) => {
            const progress = loan.principal > 0 ? Math.min(100, Math.round((loan.total_paid / loan.principal) * 100)) : 0;
            return (
              <Link
                key={loan.id}
                to="/loans"
                className="block bg-white rounded-xl border border-slate-200/60 p-4 hover:border-slate-300/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{loan.loan_number}</span>
                      <StatusBadge variant={loanStatusVariant(loan.status)}>{loanStatusLabel(loan.status)}</StatusBadge>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-1">{formatCurrency(loan.principal)} · {loan.interest_rate}% · {loan.term_months}mo</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(loan.start_date)} → {formatDate(loan.end_date)}</p>
                  </div>
                  <div className="text-right shrink-0 w-28">
                    <p className="text-xs text-slate-400 mb-1">Paid {progress}%</p>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{formatCurrency(loan.total_paid)} / {formatCurrency(loan.principal)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Payment History</h2>
          <div className="space-y-1.5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-slate-200/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-slate-400">{p.payment_number}</span>
                  <span className="text-xs font-mono text-slate-400">{p.loan_number}</span>
                  <span className="text-slate-600">{formatDate(p.payment_date)}</span>
                </div>
                <span className="font-medium text-slate-900">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
