import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Small rendered objects for the landing page, so each idea is shown rather than
 * described: a pay link in a chat, a bank transfer, a receipt, a loan schedule,
 * a reminder email, a report, a calendar. Sample data only, all built in code.
 */

const paper = 'bg-white border border-rule';

/** Three slats drawn like the building's louvres: open, half, shut. */
export function LouvreLegend({ className }: { className?: string }) {
  const item = (angle: number, label: string) => (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="21" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        {[4, 9, 14, 19].map((y) => (
          <line key={y} x1="3" x2="19" y1={y - angle} y2={y + angle} stroke="#7FB59E" strokeWidth={angle > 2 ? 3.2 : 1.6} />
        ))}
      </svg>
      {label}
    </span>
  );
  return (
    <p className={cn('flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]', className)}>
      {item(0, 'Paid')}
      {item(1.2, 'Due soon')}
      {item(2.6, 'Late')}
    </p>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col">
      <div className="flex min-h-[210px] items-end">{children}</div>
      <p className="mt-4 flex items-baseline gap-2 text-[16px] font-medium">
        <span className="num text-quiet">{n}</span>
        {label}
      </p>
    </li>
  );
}

/** Rent: link in a chat, transfer confirmation, receipt. */
export function RentFlow() {
  return (
    <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
      <Step n={1} label="Send the pay link">
        <div className="w-full max-w-[290px] space-y-2">
          <div className="ml-auto w-[86%] rounded-[3px] bg-[#D9EBDD] px-3 py-2 text-[14px] leading-snug">
            Hi Kerry-Ann, November rent is J$110,000.
            <span className="mt-1 block truncate text-shell underline underline-offset-2">easycollectja.com/pay/7f3a…</span>
            <span className="mt-1 block text-right text-[11px] text-quiet">9:14 am</span>
          </div>
          <div className="w-[52%] rounded-[3px] bg-white px-3 py-2 text-[14px] border border-rule">
            Sending it now
            <span className="mt-1 block text-right text-[11px] text-quiet">9:20 am</span>
          </div>
        </div>
      </Step>
      <Step n={2} label="They pay, then send proof">
        <div className={cn(paper, 'w-full max-w-[290px] px-4 pb-4 pt-5')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paid text-white">
            <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="mt-3 text-[15px] font-medium">Transfer successful</p>
          <p className="display num mt-1 text-[30px] font-medium leading-none">J$110,000</p>
          <dl className="mt-3 space-y-1 border-t border-rule pt-3 text-[12.5px] text-quiet">
            <div className="flex justify-between"><dt>To</dt><dd className="text-ink">Hope Pastures Ltd</dd></div>
            <div className="flex justify-between"><dt>Ref</dt><dd className="text-ink">Flat 4 Nov</dd></div>
          </dl>
        </div>
      </Step>
      <Step n={3} label="You approve, a receipt goes out">
        <div className={cn(paper, 'relative w-full max-w-[290px] px-4 pb-4 pt-4')}>
          <div className="flex items-baseline justify-between text-[12.5px] text-quiet">
            <span className="font-medium text-ink">Receipt</span>
            <span className="num">RCP-0412</span>
          </div>
          <div className="mt-3 space-y-1.5 text-[13.5px]">
            <div className="flex justify-between"><span>Kerry-Ann Williams</span><span className="num">J$110,000</span></div>
            <div className="flex justify-between text-quiet"><span>November rent, Flat 4</span><span>Bank transfer</span></div>
          </div>
          <div className="mt-4 border-t border-dashed border-rule pt-3 text-[12px] text-quiet">Emailed to the tenant</div>
          <span className="absolute bottom-3 right-4 -rotate-6 border-2 border-paid px-2 py-0.5 text-[15px] font-semibold tracking-[0.08em] text-paid">PAID</span>
        </div>
      </Step>
    </ol>
  );
}

/** Loans: one line of repayments, paid, late and still to come. */
export function LoanStrip() {
  const slots = ['p', 'p', 'p', 'l', 'x', 'd', 'd', 'd', 'd', 'd'];
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return (
    <figure>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[16px] font-medium">Tricia Lewis</p>
          <p className="text-[13.5px] text-quiet">J$250,000 over 10 months</p>
        </div>
        <p className="display num text-right text-[28px] font-medium leading-none">
          J$150,000<span className="block text-[13px] font-normal tracking-normal text-quiet">left to repay</span>
        </p>
      </div>
      <ol className="mt-5 grid grid-cols-10 gap-1.5">
        {slots.map((s, i) => (
          <li key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'h-14 w-full',
                s === 'p' && 'bg-paid',
                s === 'l' && 'bg-paid/45',
                s === 'x' && 'hatch-late border border-late',
                s === 'd' && 'border border-dashed border-quiet/60',
              )}
              aria-label={`${months[i]}: ${{ p: 'paid', l: 'paid late', x: 'late', d: 'to come' }[s]}`}
            />
            <span className="text-[11px] text-quiet">{months[i]}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Reminder email as the tenant sees it. */
function ReminderMock() {
  return (
    <div className={cn(paper, 'w-full text-[13px]')}>
      <div className="border-b border-rule px-3 py-2 text-quiet">
        <span className="text-ink">EasyCollect</span> to Shanice
      </div>
      <div className="px-3 py-3">
        <p className="font-medium">Rent of J$95,000 is 3 days late</p>
        <p className="mt-1 text-quiet">Pay by transfer to NCB, then send your screenshot.</p>
        <span className="mt-3 inline-block bg-shell px-3 py-1.5 text-[12.5px] text-white">Open pay link</span>
      </div>
    </div>
  );
}

/** Twelve months collected, the latest month darker. */
function ReportMock() {
  const v = [62, 70, 66, 74, 71, 80, 78, 84, 76, 88, 92, 58];
  return (
    <div className={cn(paper, 'w-full px-3 pb-3 pt-3')}>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium">Collected this year</span>
        <span className="num text-quiet">J$4.6M</span>
      </div>
      <div className="mt-3 flex h-[92px] items-end gap-[5px]" aria-hidden="true">
        {v.map((h, i) => (
          <span key={i} className={cn('flex-1', i === v.length - 1 ? 'bg-shell' : 'bg-paid/40')} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-quiet"><span>Dec</span><span>Nov</span></div>
    </div>
  );
}

/** A month with due dates and a lease end marked. */
function CalendarMock() {
  const marks: Record<number, string> = { 1: 'bg-shell', 3: 'bg-shell', 9: 'bg-quiet', 14: 'bg-quiet', 28: 'bg-late' };
  return (
    <div className={cn(paper, 'w-full px-3 pb-3 pt-3')}>
      <p className="text-[13px] font-medium">November</p>
      <div className="mt-2 grid grid-cols-7 gap-y-1.5 text-center text-[11.5px]">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
          <span key={d} className="flex flex-col items-center">
            <span className={cn(d === 6 && 'font-semibold text-shell')}>{d}</span>
            <span className={cn('mt-0.5 h-1 w-1 rounded-full', marks[d] ?? 'bg-transparent')} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** A late fee added to an invoice after the grace period. */
function LateFeeMock() {
  return (
    <div className={cn(paper, 'w-full px-3 py-3 text-[13px]')}>
      <div className="flex justify-between"><span>November rent</span><span className="num">J$95,000</span></div>
      <div className="mt-1.5 flex justify-between text-late"><span>Late fee, after 5 days</span><span className="num">J$5,000</span></div>
      <div className="mt-2 flex justify-between border-t border-rule pt-2 font-medium"><span>Due now</span><span className="num">J$100,000</span></div>
    </div>
  );
}

export function FeatureShowcase() {
  const items: [string, React.ReactNode][] = [
    ['Reminders that send themselves', <ReminderMock key="r" />],
    ['Late fees added for you', <LateFeeMock key="l" />],
    ['Every dollar, month by month', <ReportMock key="p" />],
    ['Due dates in one view', <CalendarMock key="c" />],
  ];
  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, mock]) => (
        <li key={label} className="flex flex-col">
          <div className="flex min-h-[170px] items-end">{mock}</div>
          <p className="mt-4 text-[16px] font-medium">{label}</p>
        </li>
      ))}
    </ul>
  );
}
