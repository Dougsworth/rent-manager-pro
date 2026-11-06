import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPnLReport } from '@/services/reports';
import type { PnLData } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportToCsv } from '@/utils/exportCsv';
import { ReportsSkeleton } from '@/components/skeletons/ReportsSkeleton';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* Palette, from DESIGN.md. Charts need literal values. */
const PAID = '#0E5A47';
const INK = '#12241D';
const QUIET = '#55635B';
const RULE = '#DAD8CF';
const POPOVER = '#FBFAF6';

const PRESETS = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-3', label: 'Last 3 months' },
  { key: 'last-6', label: 'Last 6 months' },
  { key: 'this-year', label: 'This year' },
];

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

/** Short axis money: J$85k, J$1.2m. */
function axisMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `J$${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (Math.abs(v) >= 1000) return `J$${Math.round(v / 1000)}k`;
  return `J$${v}`;
}

function rate(collected: number, expected: number): string {
  return expected > 0 ? `${((collected / expected) * 100).toFixed(1)}%` : 'None due';
}

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<PnLData | null>(null);

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

  const applyPreset = (preset: string) => {
    const { start, end } = getPresetDates(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const activePreset = PRESETS.find((p) => {
    const d = getPresetDates(p.key);
    return d.start === startDate && d.end === endDate;
  })?.key;

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

  const maxProperty = report ? Math.max(1, ...report.byProperty.map((p) => p.expected)) : 1;

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
        description="What you expected to collect, what came in, and what is still out."
        action={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={handleExportCsv} disabled={!report}>Export CSV</Button>
            <Button variant="outline" onClick={() => window.print()}>Export PDF</Button>
          </div>
        }
      />

      <div className="no-print flex flex-col gap-4 border-b border-rule pb-5 lg:flex-row lg:items-end lg:gap-8">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div>
            <Label htmlFor="start-date">From</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 sm:w-44" />
          </div>
          <div>
            <Label htmlFor="end-date">To</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 sm:w-44" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label="Quick ranges">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={activePreset === p.key}
              onClick={() => applyPreset(p.key)}
              className={cn(
                'min-h-10 cursor-pointer text-sm transition-colors duration-100',
                activePreset === p.key ? 'font-semibold text-ink underline decoration-2 underline-offset-[6px]' : 'text-shell hover:text-paid'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!report ? (
        <p className="py-10 text-[17px] text-quiet">Nothing to report for these dates. Try a wider range.</p>
      ) : (
        <>
          <p className="num mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-rule pb-5 text-base">
            <span>
              <b className="text-[22px] font-bold text-paid">{formatMoney(report.totalCollected)}</b> collected of {formatMoney(report.totalExpected)} expected
            </span>
            <span><b className="font-semibold">{report.collectionRate.toFixed(1)}%</b> collection rate</span>
            <span>
              {report.totalOutstanding > 0
                ? <><b className="font-semibold text-late">{formatMoney(report.totalOutstanding)}</b> still outstanding</>
                : <b className="font-semibold text-paid">Nothing outstanding</b>}
            </span>
          </p>

          {report.byMonth.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 className="text-base font-semibold">Collected each month</h2>
                <p className="flex gap-5 text-[13.5px] text-quiet" aria-hidden="true">
                  <span className="inline-flex items-center gap-1.5"><span className="h-[2px] w-4 bg-paid" />Collected</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-px w-4 bg-ink" />Expected</span>
                </p>
              </div>
              <div className="num h-64 sm:h-72" role="img" aria-label={`Collected against expected rent for each month. ${report.byMonth.map((m) => `${m.monthLabel}: ${formatMoney(m.collected)} of ${formatMoney(m.expected)}`).join('. ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.byMonth} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={RULE} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 12.5, fill: QUIET }}
                      tickLine={false}
                      axisLine={{ stroke: RULE }}
                      interval="preserveStartEnd"
                      minTickGap={12}
                    />
                    <YAxis
                      tick={{ fontSize: 12.5, fill: QUIET }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={axisMoney}
                    />
                    <Tooltip
                      formatter={(value, name) => [formatMoney(Number(value)), name]}
                      cursor={{ stroke: RULE }}
                      contentStyle={{ background: POPOVER, border: `1px solid ${RULE}`, borderRadius: 3, boxShadow: 'none', fontSize: 13.5, color: INK, fontVariantNumeric: 'tabular-nums' }}
                      labelStyle={{ fontWeight: 600, marginBottom: 2 }}
                      itemStyle={{ color: INK, padding: 0 }}
                    />
                    <Line type="linear" dataKey="expected" name="Expected" stroke={INK} strokeWidth={1} dot={false} activeDot={{ r: 3, fill: INK, stroke: INK }} isAnimationActive={false} />
                    <Line type="linear" dataKey="collected" name="Collected" stroke={PAID} strokeWidth={2.5} dot={{ r: 2.5, fill: PAID, stroke: PAID }} activeDot={{ r: 4, fill: PAID, stroke: PAID }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {report.byProperty.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-2 text-base font-semibold">By property</h2>
              <ul>
                {report.byProperty.map((p) => (
                  <li key={p.property_name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5 border-t border-rule py-3 sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)_auto]">
                    <span className="truncate font-medium">{p.property_name}</span>
                    <span className="num text-right text-[15px] sm:order-3">
                      <b className="font-semibold">{formatMoney(p.collected)}</b> <span className="text-quiet">of {formatMoney(p.expected)}</span>
                    </span>
                    <span aria-hidden="true" className="col-span-2 block h-2 bg-secondary sm:col-span-1" style={{ width: `${Math.max(2, (p.expected / maxProperty) * 100)}%` }}>
                      <span className="block h-full bg-paid" style={{ width: `${p.expected > 0 ? Math.min(100, (p.collected / p.expected) * 100) : 0}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="mb-2 text-base font-semibold">Profit and loss</h2>
            <div className="overflow-x-auto">
              <table className="num w-full min-w-[520px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-[13.5px] text-quiet">
                    <th scope="col" className="py-2 pr-4 text-left font-normal">Month</th>
                    <th scope="col" className="px-4 py-2 text-right font-normal">Expected</th>
                    <th scope="col" className="px-4 py-2 text-right font-normal">Collected</th>
                    <th scope="col" className="px-4 py-2 text-right font-normal">Outstanding</th>
                    <th scope="col" className="py-2 pl-4 text-right font-normal">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byMonth.map((m) => (
                    <tr key={m.month} className="border-t border-rule">
                      <th scope="row" className="py-2.5 pr-4 text-left font-medium">{m.monthLabel}</th>
                      <td className="px-4 py-2.5 text-right">{formatMoney(m.expected)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatMoney(m.collected)}</td>
                      <td className={cn('px-4 py-2.5 text-right', m.outstanding > 0 ? 'text-late' : 'text-quiet')}>{formatMoney(m.outstanding)}</td>
                      <td className="py-2.5 pl-4 text-right text-quiet">{rate(m.collected, m.expected)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-ink font-semibold">
                    <th scope="row" className="py-3 pr-4 text-left">Total</th>
                    <td className="px-4 py-3 text-right">{formatMoney(report.totalExpected)}</td>
                    <td className="px-4 py-3 text-right text-paid">{formatMoney(report.totalCollected)}</td>
                    <td className={cn('px-4 py-3 text-right', report.totalOutstanding > 0 && 'text-late')}>{formatMoney(report.totalOutstanding)}</td>
                    <td className="py-3 pl-4 text-right">{report.collectionRate.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
