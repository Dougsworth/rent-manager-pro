import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCollections, type CollectionItem } from '@/services/collections';
import { PageHeader } from '@/components/PageHeader';
import { ReminderButton } from '@/components/collect/ReminderButton';
import { timingLabel } from '@/components/collect/CollectionRow';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/money';

/** Everyone you can chase by email today, and whether automatic reminders are on. */
export default function Reminders() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<CollectionItem[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const c = await getCollections(user.id).catch(() => null);
    setItems(c ? c.items.filter((i) => i.kind === 'rent') : []);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const auto = !!(profile as any)?.notification_preferences?.auto_remind;

  if (!items) return <div aria-busy="true"><Skeleton className="h-12 w-64" /><Skeleton className="mt-8 h-40 w-full" /></div>;

  const late = items.filter((i) => i.daysLate > 0).sort((a, b) => b.daysLate - a.daysLate);
  const soon = items.filter((i) => i.daysLate === 0 && i.daysUntilDue <= 7);

  const list = (rows: CollectionItem[], empty: string) => rows.length === 0 ? <p className="border-t border-rule py-4 text-quiet">{empty}</p> : (
    <ul>
      {rows.map((i) => (
        <li key={i.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-rule py-3 sm:grid-cols-[1fr_120px_110px_190px]">
          <div className="min-w-0">
            <Link to={`/tenants/${i.personId}`} className="block truncate font-semibold hover:underline">{i.name}</Link>
            <span className="block truncate text-[13.5px] text-quiet">{i.email || 'No email on file, reminders cannot be sent'}</span>
          </div>
          <span className="num text-right font-semibold sm:order-3">{formatMoney(i.amount)}</span>
          <span className={i.daysLate > 0 ? 'text-sm font-semibold text-late sm:order-2' : 'text-sm sm:order-2'}>{timingLabel(i)}</span>
          <div className="text-right sm:order-4">{i.email ? <ReminderButton tenantId={i.personId} invoiceId={i.invoiceId} /> : <Link to={`/tenants/${i.personId}`} className="text-sm font-semibold text-shell underline">Add email</Link>}</div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title="Reminders" description="Reminders go by email with the amount, your bank details and a pay link." />
      <p className="mb-8 text-[15px]">
        {auto
          ? <>Automatic reminders are <b className="font-semibold text-paid">on</b>. Late tenants get an email each day until they pay. </>
          : <>Automatic reminders are <b className="font-semibold">off</b>. You send each one yourself. </>}
        <Link to="/settings?section=notifications" className="font-semibold text-shell underline">Change this</Link>
      </p>
      <section className="mb-9">
        <h2 className="pb-2 text-[15px] font-semibold">Late now</h2>
        {list(late, 'Nobody is late. Nothing to send.')}
      </section>
      <section>
        <h2 className="pb-2 text-[15px] font-semibold">Due in the next 7 days</h2>
        {list(soon, 'Nothing is due this week.')}
      </section>
      <p className="mt-8 text-[13.5px] text-quiet">Loan reminders are not sent by email yet. Use Copy pay link or call the borrower from their page.</p>
    </>
  );
}
