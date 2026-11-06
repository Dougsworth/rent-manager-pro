import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantLedger } from '@/services/ledger';
import { deleteTenant } from '@/services/tenants';
import { HistorySection, PersonActions, Timeline, Facts, owedLine } from '@/components/collect/PersonParts';
import { TenantDocuments } from '@/components/TenantDocuments';
import { EditTenantModal } from '@/components/EditTenantModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/lib/utils';

export default function TenantProfile() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof getTenantLedger>> | null>(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try { setLedger(await getTenantLedger(id)); }
    catch (err) { console.error('Failed to load tenant:', err); setMissing(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (missing) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold">We could not find that tenant</h1>
        <p className="mt-1 text-quiet">They may have been removed.</p>
        <Link to="/tenants" className="mt-4 inline-block font-semibold text-shell underline">Back to tenants</Link>
      </div>
    );
  }
  if (!ledger || !user) return <div aria-busy="true"><Skeleton className="h-12 w-80" /><Skeleton className="mt-8 h-24 w-full" /></div>;

  const t = ledger.tenant;
  const name = `${t.first_name} ${t.last_name}`.trim();
  const place = [t.unit?.name, t.unit?.property?.name].filter(Boolean).join(', ');
  const owed = owedLine(ledger.open);

  const remove = async () => {
    if (!confirm(`Remove ${name}? Their invoices and payments stay in your records.`)) return;
    try {
      await deleteTenant(id);
      toast(`${name} removed.`, 'success');
      navigate('/tenants');
    } catch {
      toast('That tenant was not removed. Try again.', 'error');
    }
  };

  return (
    <>
      <Link to="/tenants" className="text-sm font-medium text-shell underline">Tenants</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div className="min-w-0">
          <h1 className="display text-[34px] font-bold leading-[1.05] sm:text-[46px]">{name}</h1>
          <p className="mt-1.5 text-base">
            <b className={cn('num font-bold', owed.late ? 'text-late' : 'text-ink')}>{owed.text}</b>{place && ` ${place}.`}
          </p>
        </div>
        <PersonActions landlordId={user.id} personId={id} name={name} kind="rent" open={ledger.open} onChanged={load} />
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-9">
          <HistorySection ledger={ledger} />
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Tenancy</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-late" onClick={remove}>Remove</Button>
              </div>
            </div>
            <Facts items={[
              ['Rent', t.unit?.rent_amount ? `${formatMoney(t.unit.rent_amount)} a month` : null],
              ['Lease', t.lease_start || t.lease_end ? `${t.lease_start ? formatDate(t.lease_start) : 'Open'} to ${t.lease_end ? formatDate(t.lease_end) : 'open'}` : null],
              ['Phone', t.phone ? <a href={`tel:${t.phone}`} className="underline">{t.phone}</a> : null],
              ['Email', t.email ? <a href={`mailto:${t.email}`} className="underline">{t.email}</a> : null],
            ]} />
          </section>
          <TenantDocuments tenantId={id} landlordId={user.id} />
        </div>
        <Timeline entries={ledger.timeline} />
      </div>

      <EditTenantModal
        open={editing}
        tenant={{ ...t, unit_name: t.unit?.name ?? '', property_name: t.unit?.property?.name ?? '', rent_amount: t.unit?.rent_amount ?? 0, payment_status: 'pending' }}
        onClose={() => setEditing(false)}
        onSuccess={() => { setEditing(false); load(); }}
      />
    </>
  );
}
