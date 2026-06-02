import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPnLReport } from '@/services/reports';
import { getLoans, getLoanStats } from '@/services/loans';
import type { PnLData, LoanWithBorrower, LoanDashboardStats } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportToCsv } from '@/utils/exportCsv';
import { Download, Printer } from 'lucide-react';
import { ReportsSkeleton } from '@/components/skeletons/ReportsSkeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function getPresetDates(preset: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this-month': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'last-3': {
      const start = new Date(y, m - 2, 1);
      const end = new Date(y, m + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'last-6': {
      const start = new Date(y, m - 5, 1);
      const end = new Date(y, m + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'this-year': {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      return { start: fmt(start), end: fmt(end) };
    }
    default:
      return { start: fmt(new Date(y, 0, 1)), end: fmt(new Date(y, 11, 31)) };
  }
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<PnLData | null>(null);
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loanStats, setLoanStats] = useState<LoanDashboardStats | null>(null);

  const defaultDates = getPresetDates('this-year');
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const loadReport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getPnLReport(user.id, startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [user, startDate, endDate]);

  // Loan portfolio reflects current state, so it loads once (not tied to the date range).
  useEffect(() => {
    if (!user) return;
    Promise.all([getLoans(user.id), getLoanStats(user.id)])
      .then(([l, s]) => { setLoans(l); setLoanStats(s); })
      .catch((err) => console.error('Failed to load loan portfolio:', err));
  }, [user]);

  const handleExportLoansCsv = () => {
    const rows = loans.map((l) => ({
      loan_number: l.loan_number,
      borrower: `${l.borrower_first_name} ${l.borrower_last_name}`.trim(),
      principal: l.principal,
      total_paid: l.total_paid,
      outstanding: Math.max(0, l.principal - l.total_paid),
      interest_rate: `${l.interest_rate}%`,
      term_months: l.term_months,
      status: l.status,
      start_date: l.start_date,
      end_date: l.end_date,
    }));
    exportToCsv('loan-portfolio.csv', rows, [
      { key: 'loan_number', header: 'Loan #' },
      { key: 'borrower', header: 'Borrower' },
      { key: 'principal', header: 'Principal' },
      { key: 'total_paid', header: 'Paid' },
      { key: 'outstanding', header: 'Outstanding' },
      { key: 'interest_rate', header: 'Interest Rate' },
      { key: 'term_months', header: 'Term (months)' },
      { key: 'status', header: 'Status' },
      { key: 'start_date', header: 'Start Date' },
      { key: 'end_date', header: 'End Date' },
    ]);
  };

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

  const applyPreset = (preset: string) => {
    const { start, end } = getPresetDates(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows = report.byMonth.map((m) => ({
      month: m.monthLabel,
      expected: m.expected,
      collected: m.collected,
      outstanding: m.outstanding,
      rate: m.expected > 0 ? `${((m.collected / m.expected) * 100).toFixed(1)}%` : '0%',
    }));
    exportToCsv('rent-report.csv', rows, [
      { key: 'month', header: 'Month' },
      { key: 'expected', header: 'Expected' },
      { key: 'collected', header: 'Collected' },
      { key: 'outstanding', header: 'Outstanding' },
      { key: 'rate', header: 'Collection Rate' },
    ]);
  };

  if (loading) return <ReportsSkeleton />;

  return (
    <div className="print-report">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .print-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Reports"
        description="Collection analytics and P&L reporting"
        action={
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handleExportCsv} disabled={!report}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 no-print">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div>
            <Label htmlFor="start-date" className="text-xs text-slate-500">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-xs text-slate-500">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => applyPreset('this-month')}>This Month</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('last-3')}>Last 3 Months</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('last-6')}>Last 6 Months</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('this-year')}>This Year</Button>
          </div>
        </div>
      </div>

      {!report ? (
        <div className="text-center py-16 text-slate-500">No data available for the selected period.</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Expected"
                value={formatCurrency(report.totalExpected)}
              />
              <StatCard
                label="Total Collected"
                value={formatCurrency(report.totalCollected)}
                valueColor="text-emerald-600"
              />
              <StatCard
                label="Outstanding"
                value={formatCurrency(report.totalOutstanding)}
                valueColor={report.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}
              />
              <StatCard
                label="Collection Rate"
                value={`${report.collectionRate.toFixed(1)}%`}
                valueColor={report.collectionRate >= 90 ? 'text-emerald-600' : report.collectionRate >= 70 ? 'text-amber-600' : 'text-red-500'}
              />
            </div>
          </div>

          {/* Collection Trend Chart */}
          {report.byMonth.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `J$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="expected" name="Expected" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="collected" name="Collected" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Breakdown Chart */}
          {report.byProperty.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Property Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.byProperty}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="property_name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `J$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="expected" name="Expected" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P&L Table */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Profit & Loss Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Month</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Expected</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Collected</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Outstanding</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.byMonth.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{m.monthLabel}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-600">{formatCurrency(m.expected)}</td>
                        <td className="py-3 px-4 text-sm text-right text-emerald-600 font-medium">{formatCurrency(m.collected)}</td>
                        <td className="py-3 px-4 text-sm text-right text-amber-600">{formatCurrency(m.outstanding)}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-600">
                          {m.expected > 0 ? `${((m.collected / m.expected) * 100).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 font-semibold">
                      <td className="py-3 px-4 text-sm text-slate-900">Total</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(report.totalExpected)}</td>
                      <td className="py-3 px-4 text-sm text-right text-emerald-600">{formatCurrency(report.totalCollected)}</td>
                      <td className="py-3 px-4 text-sm text-right text-amber-600">{formatCurrency(report.totalOutstanding)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-900">{report.collectionRate.toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Loan Portfolio — current state, independent of the date range above */}
      {loanStats && loans.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Loan Portfolio <span className="text-xs font-normal text-slate-400">(current)</span></h2>
              <Button variant="outline" size="sm" onClick={handleExportLoansCsv} className="no-print">
                <Download className="h-4 w-4 mr-2" />
                Export Loans
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Lent" value={formatCurrency(loanStats.totalLent)} />
              <StatCard label="Collected" value={formatCurrency(loanStats.totalCollected)} valueColor="text-emerald-600" />
              <StatCard label="Outstanding" value={formatCurrency(loanStats.totalOutstanding)} valueColor={loanStats.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'} />
              <StatCard label="Active Loans" value={String(loanStats.activeLoanCount)} />
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Loan #</th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Borrower</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Principal</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Paid</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Outstanding</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-mono text-slate-400">{l.loan_number}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{l.borrower_first_name} {l.borrower_last_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-600">{formatCurrency(l.principal)}</td>
                        <td className="py-3 px-4 text-sm text-right text-emerald-600 font-medium">{formatCurrency(l.total_paid)}</td>
                        <td className="py-3 px-4 text-sm text-right text-amber-600">{formatCurrency(Math.max(0, l.principal - l.total_paid))}</td>
                        <td className="py-3 px-4 text-right">
                          <StatusBadge variant={loanStatusVariant(l.status)}>{loanStatusLabel(l.status)}</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
