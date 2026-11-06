import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCollections, type CollectionItem, type CollectionsSummary } from '@/services/collections';
import { CollectionRow } from '@/components/collect/CollectionRow';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/utils/formatDate';

function Group({ title, items, landlordId, onChanged }: { title: string; items: CollectionItem[]; landlordId: string; onChanged: () => void }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="pb-2 text-[15px] font-semibold">{title}</h2>
      <ul>{items.map((item) => <CollectionRow key={item.key} item={item} landlordId={landlordId} onChanged={onChanged} />)}</ul>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<CollectionsSummary | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    try {
      setData(await getCollections(user.id));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(true);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="border-t border-rule py-10">
        <h1 className="text-xl font-semibold">We could not load what's owed</h1>
        <p className="mt-1 text-quiet">Your data is safe. Check your connection and try again.</p>
        <Button className="mt-4" onClick={load}>Try again</Button>
      </div>
    );
  }
  if (!data || !user) return <DashboardSkeleton />;

  const now = new Date();
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const asOf = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const late = data.items.filter((i) => i.daysLate > 0).sort((a, b) => b.daysLate - a.daysLate);
  const coming = data.items.filter((i) => i.daysLate === 0);

  if (data.isEmpty) {
    return (
      <div className="max-w-xl pt-6">
        <h1 className="display text-[40px] font-bold leading-[1.05]">Nothing owed yet</h1>
        <p className="mt-3 text-[17px] text-quiet">Add someone who owes you. Once they are here, this page tells you who to chase each day.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/properties"><Button>Add a property and tenants</Button></Link>
          <Link to="/loans"><Button variant="outline">Add a loan</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-[15px] text-quiet">{asOf}</p>
      <h1 className="display num mt-0.5 text-[42px] font-bold leading-none sm:text-[68px]">
        {formatMoney(data.owed)} <span className="block text-[26px] font-semibold sm:inline sm:text-[68px] sm:font-bold">still owed</span>
      </h1>
      <p className="num mt-3 flex flex-wrap gap-x-9 gap-y-1 border-b border-rule pb-5 text-base">
        <span>{data.late > 0
          ? <><b className="font-bold text-late">{formatMoney(data.late)} late</b> from {data.lateCount} {data.lateCount === 1 ? 'person' : 'people'}</>
          : <b className="font-semibold text-paid">Nobody is late</b>}</span>
        <span><b className="font-semibold">{formatMoney(data.comingUp)}</b> coming up</span>
        <span><b className="font-semibold">{formatMoney(data.collected)}</b> collected in {month}</span>
      </p>

      <div className="mt-5">
        <Group title="Chase these first" items={late} landlordId={user.id} onChanged={load} />
        <Group title="Coming up" items={coming} landlordId={user.id} onChanged={load} />
        {data.items.length === 0 && (
          <p className="py-6 text-[17px]">Everyone is paid up. Enjoy the quiet.</p>
        )}
      </div>

      {data.recent.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between pb-2">
            <h2 className="text-[15px] font-semibold">Just collected</h2>
            <Link to="/payments" className="text-sm font-medium text-shell underline">All payments</Link>
          </div>
          <ul>
            {data.recent.map((p) => (
              <li key={p.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-rule py-2 text-sm">
                <span className="truncate">{p.name}</span>
                <span className="text-quiet">{formatDate(p.date)}</span>
                <span className="num font-medium">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
