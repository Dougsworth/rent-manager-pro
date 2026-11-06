import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBorrowerLedger } from '@/services/ledger';
import { HistorySection, PersonActions, Timeline, Facts, owedLine } from '@/components/collect/PersonParts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/lib/utils';

const loanStatus: Record<string, string> = { active: 'Active', paid_off: 'Paid off', defaulted: 'Defaulted' };

export default function BorrowerProfile() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof getBorrowerLedger>> | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    try { setLedger(await getBorrowerLedger(id)); }
    catch (err) { console.error('Failed to load borrower:', err); setMissing(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (missing) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold">We could not find that borrower</h1>
        <Link to="/borrowers" className="mt-4 inline-block font-semibold text-shell underline">Back to borrowers</Link>
      </div>
    );
  }
  if (!ledger || !user) return <div aria-busy="true"><Skeleton className="h-12 w-80" /><Skeleton className="mt-8 h-24 w-full" /></div>;

  const b = ledger.borrower;
  const name = `${b.first_name} ${b.last_name}`.trim();
  const owed = owedLine(ledger.open);
  const lent = ledger.loans.reduce((s, l) => s + Number(l.principal), 0);
  const repaid = ledger.loans.reduce((s, l) => s + Number(l.total_paid), 0);

  return (
    <>
      <Link to="/borrowers" className="text-sm font-medium text-shell underline">Borrowers</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div className="min-w-0">
          <h1 className="display text-[34px] font-bold leading-[1.05] sm:text-[46px]">{name}</h1>
          <p className="mt-1.5 text-base"><b className={cn('num font-bold', owed.late ? 'text-late' : 'text-ink')}>{owed.text}</b></p>
        </div>
        <PersonActions landlordId={user.id} personId={id} name={name} kind="loan" open={ledger.open} onChanged={load} />
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-9">
          <HistorySection ledger={ledger} />
          <section>
            <h2 className="mb-3 text-base font-semibold">Loans</h2>
            {ledger.loans.length === 0 ? <p className="border-t border-rule py-3 text-quiet">No loans yet. <Link to="/loans" className="font-semibold text-shell underline">Add a loan</Link></p> : (
              <ul>
                {ledger.loans.map((l) => (
                  <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-rule py-2.5 text-[15px]">
                    <span className="font-medium">{l.loan_number}, {formatMoney(l.principal)}</span>
                    <span className="text-quiet">{loanStatus[l.status] ?? l.status}</span>
                    <span className="text-[13.5px] text-quiet">{formatMoney(l.monthly_installment)} a month from {formatDate(l.start_date)}</span>
                    <span className="num text-right text-[13.5px]">{formatMoney(l.total_paid)} repaid</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">Contact</h2>
            <Facts items={[
              ['Phone', b.phone ? <a href={`tel:${b.phone}`} className="underline">{b.phone}</a> : null],
              ['Email', b.email ? <a href={`mailto:${b.email}`} className="underline">{b.email}</a> : null],
              ['Lent in total', formatMoney(lent)],
              ['Repaid in total', formatMoney(repaid)],
            ]} />
            {b.notes && <p className="mt-3 text-[15px] text-quiet">{b.notes}</p>}
          </section>
        </div>
        <Timeline entries={ledger.timeline} />
      </div>
    </>
  );
}
