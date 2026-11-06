import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { CoinMark } from '@/components/BrandLogo';
import { PaymentLouvre, LouvreKey } from '@/components/collect/PaymentLouvre';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { HistoryMonth, HistoryState } from '@/services/collections';

/**
 * A working miniature of the Today page for the landing page. Sample people,
 * real components, local state only. Nothing here touches the backend.
 */

export type DemoStatus = 'open' | 'waiting' | 'reminded' | 'paid';
type Status = DemoStatus;

interface Row {
  id: string;
  name: string;
  what: string;
  amount: number;
  /** Negative is days late, positive is days until due. */
  days: number;
  pattern: string; // 12 chars: p paid, l paid late, x late now, d due, n none
  remindable: boolean;
  /** Flat number in the sample building, for rent rows. */
  flat?: number;
}

export const DEMO_ROWS: Row[] = [
  { id: 'ka', name: 'Kerry-Ann Williams', what: 'Flat 4, Hope Pastures Flats', amount: 110000, days: -5, pattern: 'ppplppplpppx', remindable: true, flat: 4 },
  { id: 'sc', name: 'Shanice Campbell', what: 'Flat 6, Hope Pastures Flats', amount: 95000, days: -3, pattern: 'pppppplppppx', remindable: true, flat: 6 },
  { id: 'tl', name: 'Tricia Lewis', what: 'Personal loan, payment 5 of 10', amount: 25000, days: -2, pattern: 'nnnnnnnpplpx', remindable: false },
  { id: 'dg', name: 'Delroy Graham', what: 'Personal loan, payment 4 of 12', amount: 40000, days: 3, pattern: 'nnnnnnnnpppd', remindable: false },
  { id: 'dm', name: 'Dwight Morgan-Clarke', what: 'Flat 3, Hope Pastures Flats', amount: 120000, days: 8, pattern: 'pppppppppppd', remindable: true, flat: 3 },
];

const CODE: Record<string, HistoryState> = { p: 'paid', l: 'paid-late', x: 'late', d: 'due', n: 'none' };
const NOTE: Record<HistoryState, string> = {
  paid: 'Paid on time', 'paid-late': 'Paid late', late: 'Late now', due: 'Due', none: 'Before they began',
};

function months(pattern: string, now: Date): HistoryMonth[] {
  return pattern.split('').map((c, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const state = CODE[c];
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-JM', { month: 'long', year: 'numeric' }),
      short: d.toLocaleDateString('en-JM', { month: 'short' }),
      state,
      note: NOTE[state],
    };
  });
}

function timing(days: number) {
  if (days < 0) return `${-days} ${days === -1 ? 'day' : 'days'} late`;
  return `In ${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Counts from the old figure to the new one with an exponential ease out. */
function useCountTo(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { from.current = target; setShown(target); return; }
    const t0 = performance.now();
    const dur = 650;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(2, -10 * k);
      const v = Math.round((start + (target - start) * (k === 1 ? 1 : eased)) / 1000) * 1000;
      setShown(k === 1 ? target : v);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target]);
  return shown;
}

interface LedgerDemoProps {
  status: Record<string, Status>;
  setStatus: Dispatch<SetStateAction<Record<string, Status>>>;
}

export function LedgerDemo({ status, setStatus }: LedgerDemoProps) {
  const now = useMemo(() => new Date(), []);
  const timers = useRef<Record<string, number>>({});
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const get = (id: string): Status => status[id] ?? 'open';
  const set = (id: string, s: Status) => setStatus((prev) => ({ ...prev, [id]: s }));

  const open = DEMO_ROWS.filter((r) => get(r.id) !== 'paid');
  const owed = open.reduce((s, r) => s + r.amount, 0);
  const late = open.filter((r) => r.days < 0);
  const lateTotal = late.reduce((s, r) => s + r.amount, 0);
  const collected = DEMO_ROWS.filter((r) => get(r.id) === 'paid').reduce((s, r) => s + r.amount, 0);
  const shown = useCountTo(owed);
  const touched = Object.keys(status).length > 0;

  const remind = (id: string) => {
    set(id, 'waiting');
    timers.current[id] = window.setTimeout(() => set(id, 'reminded'), 4000);
  };
  const undo = (id: string) => {
    clearTimeout(timers.current[id]);
    setStatus(({ [id]: _drop, ...rest }) => rest);
  };
  const markPaid = (id: string) => {
    clearTimeout(timers.current[id]);
    set(id, 'paid');
  };
  const reset = () => {
    Object.values(timers.current).forEach(clearTimeout);
    setStatus({});
  };

  const summary = late.length
    ? `${formatMoney(lateTotal)} of it is late, from ${late.length} ${late.length === 1 ? 'person' : 'people'}.`
    : 'Nobody is late.';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div>
          <p className="display num text-[44px] font-medium leading-none tracking-[-0.02em] sm:text-[72px] sm:tracking-[-0.03em]" aria-hidden="true">
            {formatMoney(shown)}<span className="ml-3 text-[22px] font-normal tracking-normal text-quiet sm:text-[28px]">still owed</span>
          </p>
          <p className="sr-only" aria-live="polite">{formatMoney(owed)} still owed. {summary}</p>
          <p className="mt-3 text-[16px] sm:text-[17px]" aria-hidden="true">
            {late.length ? <><span className="font-medium text-late">{formatMoney(lateTotal)} of it is late</span>, from {late.length} {late.length === 1 ? 'person' : 'people'}.</> : 'Nobody is late.'}
            {collected > 0 && <span className="text-quiet"> {formatMoney(collected)} collected just now.</span>}
          </p>
        </div>
        <p className="text-[13.5px] text-quiet">
          Sample people and amounts. Press the buttons.
          {touched && <> <button type="button" onClick={reset} className="cursor-pointer font-medium text-shell underline underline-offset-[3px]">Start over</button></>}
        </p>
      </div>

      <ul className="mt-8 border-b border-rule">
        {DEMO_ROWS.map((r) => {
          const s = get(r.id);
          const paid = s === 'paid';
          const isLate = r.days < 0 && !paid;
          let pattern = r.pattern;
          if (paid) pattern = pattern.slice(0, 11) + (r.days < 0 ? 'l' : 'p');
          return (
            <li key={r.id} className="border-t border-rule">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 py-4 lg:grid-cols-[minmax(190px,1fr)_200px_118px_110px_300px] lg:items-center lg:gap-x-6">
                <div className="min-w-0">
                  <div className={cn('truncate text-base', isLate ? 'font-medium' : 'font-normal', paid && 'text-quiet')}>{r.name}</div>
                  <div className="truncate text-[13.5px] text-quiet">{r.what}</div>
                </div>
                <div className={cn('num relative text-right text-base font-medium lg:order-4', paid && 'text-quiet')}>
                  <span className={cn(paid && 'line-through decoration-1')}>{formatMoney(r.amount)}</span>
                  {paid && <span className="money-pop" aria-hidden="true">+{formatMoney(r.amount)}</span>}
                </div>
                <div className="col-span-2 text-sm lg:order-3 lg:col-span-1">
                  {paid
                    ? <span className="inline-flex items-center gap-1 font-medium text-paid"><CoinMark />Paid just now</span>
                    : <span className={isLate ? 'font-medium text-late' : ''}>{timing(r.days)}</span>}
                </div>
                <PaymentLouvre months={months(pattern, now)} className="col-span-2 lg:order-2 lg:col-span-1" />
                <div className="col-span-2 flex min-h-10 gap-2 lg:order-5 lg:col-span-1 lg:justify-end">
                  {!paid && isLate && r.remindable && s === 'open' && (
                    <Button onClick={() => remind(r.id)} className="flex-1 lg:flex-none">Send reminder</Button>
                  )}
                  {!paid && s === 'waiting' && (
                    <Button variant="outline" onClick={() => undo(r.id)} className="flex-1 lg:flex-none" aria-live="polite">Sending, tap to undo</Button>
                  )}
                  {!paid && s === 'reminded' && (
                    <span role="status" className="inline-flex h-10 flex-1 items-center justify-center whitespace-nowrap px-1 text-sm font-medium text-paid lg:flex-none">Reminded today</span>
                  )}
                  {!paid && (
                    <Button variant="outline" onClick={() => markPaid(r.id)} className="flex-1 lg:flex-none">Mark paid</Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <LouvreKey className="mt-4" />
    </div>
  );
}
