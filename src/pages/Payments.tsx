import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPayments, createPayment } from '@/services/payments';
import { createPaymentSchema } from '@/schemas';
import { getTenants } from '@/services/tenants';
import { getInvoices } from '@/services/invoices';
import { getProofsForLandlord, approveProof, rejectProof } from '@/services/paymentProofs';
import type { PaymentWithDetails, TenantWithDetails, InvoiceWithTenant, PaymentProofWithDetails } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { PaymentsSkeleton } from '@/components/skeletons/PaymentsSkeleton';
import { exportToCsv } from '@/utils/exportCsv';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/utils/formatDate';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Pagination, paginate } from '@/components/Pagination';

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

const statusVariantMap: Record<string, 'paid' | 'pending' | 'overdue'> = {
  completed: 'paid',
  pending: 'pending',
  failed: 'pending', // failed payments are not overdue, they just didn't go through
};

const statusWords: Record<string, string> = { completed: 'Received', pending: 'Pending', failed: 'Failed' };

/** Desktop columns. Below lg each row stacks into two lines. */
const COLS = 'lg:grid-cols-[84px_minmax(170px,1fr)_108px_116px_100px_120px_72px]';

const emptyPayment = { tenant_id: '', invoice_id: '', amount: '', method: 'bank_transfer', payment_date: '', notes: '' };

export default function Payments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [proofs, setProofs] = useState<PaymentProofWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRecord, setShowRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [newPayment, setNewPayment] = useState(emptyPayment);
  const [activeTab, setActiveTab] = useState<'payments' | 'proofs'>('payments');
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadData = async () => {
    if (!user) return;
    try {
      const [p, t, i, pr] = await Promise.all([
        getPayments(user.id),
        getTenants(user.id),
        getInvoices(user.id),
        getProofsForLandlord(user.id),
      ]);
      setPayments(p);
      setTenants(t);
      setInvoices(i);
      setProofs(pr);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // The app wide "Record a payment" buttons land here with ?record=1.
  useEffect(() => {
    if (searchParams.get('record') !== '1') return;
    setActiveTab('payments');
    setShowRecord(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('record');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const [recordError, setRecordError] = useState('');

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRecordError('');

    const result = createPaymentSchema.safeParse(newPayment);
    if (!result.success) {
      setRecordError(result.error.issues[0].message);
      return;
    }

    setRecording(true);
    try {
      await createPayment(user.id, {
        tenant_id: newPayment.tenant_id,
        invoice_id: newPayment.invoice_id || undefined,
        amount: Math.round(Number(newPayment.amount)),
        method: newPayment.method as any,
        payment_date: newPayment.payment_date || undefined,
        notes: newPayment.notes || undefined,
      });
      const tenant = tenants.find(t => t.id === newPayment.tenant_id);
      setShowRecord(false);
      setNewPayment(emptyPayment);
      toast(`${formatMoney(Number(newPayment.amount))}${tenant ? ` from ${tenant.first_name} ${tenant.last_name}` : ''} recorded.`, 'success');
      await loadData();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setRecordError(err?.message ?? 'That payment did not save. Check your connection and try again.');
    } finally {
      setRecording(false);
    }
  };

  const handleApprove = async (proof: PaymentProofWithDetails) => {
    if (!user) return;
    setActionLoading(proof.id);
    try {
      await approveProof(proof.id, user.id, proof.invoice_id, proof.tenant_id, proof.invoice_amount);
      toast(`Approved. ${formatMoney(proof.invoice_amount)} from ${proof.tenant_first_name} is recorded as paid.`, 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to approve proof:', err);
      toast('That proof was not approved. Try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proofId: string) => {
    setActionLoading(proofId);
    try {
      await rejectProof(proofId, user!.id, rejectNote);
      toast('Proof rejected. The invoice stays unpaid.');
      setRejectingId(null);
      setRejectNote('');
      await loadData();
    } catch (err) {
      console.error('Failed to reject proof:', err);
      toast('That proof was not rejected. Try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingProofs = proofs.filter(p => p.status === 'pending');

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalFailed = payments
    .filter(p => p.status === 'failed')
    .reduce((sum, p) => sum + p.amount, 0);

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const thisMonth = payments
    .filter(p => p.status === 'completed' && p.payment_date >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(payment => {
    const tenantName = `${payment.tenant_first_name} ${payment.tenant_last_name}`.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = tenantName.includes(q) ||
                         (payment.property_name ?? '').toLowerCase().includes(q) ||
                         payment.payment_number.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedPayments = paginate(filteredPayments, currentPage, PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const unpaidInvoices = invoices.filter(i => i.tenant_id === newPayment.tenant_id && i.status !== 'paid');

  const handleExport = () => {
    const rows = filteredPayments.map((p) => ({
      payment_number: p.payment_number,
      tenant: `${p.tenant_first_name} ${p.tenant_last_name}`,
      property: `${p.property_name}${p.unit_name ? `, ${p.unit_name}` : ''}`,
      amount: p.amount,
      payment_date: p.payment_date,
      method: methodLabels[p.method] ?? p.method,
      status: p.status,
    }));
    exportToCsv('payments.csv', rows, [
      { key: 'payment_number', header: 'Payment ID' },
      { key: 'tenant', header: 'Tenant' },
      { key: 'property', header: 'Property' },
      { key: 'amount', header: 'Amount' },
      { key: 'payment_date', header: 'Date' },
      { key: 'method', header: 'Method' },
      { key: 'status', header: 'Status' },
    ]);
  };

  if (loading) return <PaymentsSkeleton />;

  const personLink = (tenantId: string | null | undefined, first: string, last: string, strong = false) =>
    tenantId ? (
      <Link to={`/tenants/${tenantId}`} className={cn('block truncate text-base text-ink hover:underline', strong ? 'font-semibold' : 'font-medium')}>
        {first} {last}
      </Link>
    ) : (
      <span className={cn('block truncate text-base', strong ? 'font-semibold' : 'font-medium')}>{first} {last}</span>
    );

  return (
    <>
      <PageHeader
        title="Payments"
        description="Money you have received, and proofs of payment waiting for you."
        action={<Button onClick={() => { setActiveTab('payments'); setShowRecord(true); }}>Record Payment</Button>}
      />

      <FilterTabs
        tabs={[
          { value: 'payments' as const, label: 'All payments', count: payments.length },
          { value: 'proofs' as const, label: 'Pending Proofs', count: pendingProofs.length > 0 ? pendingProofs.length : undefined },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'payments' && (
        <>
          {payments.length > 0 && (
            <p className="num mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-rule pb-5 text-base">
              <span><b className="text-[22px] font-bold">{formatMoney(thisMonth)}</b> collected in {monthName}</span>
              <span><b className="font-semibold">{formatMoney(totalCollected)}</b> collected in all</span>
              <span>
                {totalPending > 0
                  ? <><b className="font-semibold text-late">{formatMoney(totalPending)}</b> still unpaid on invoices</>
                  : <b className="font-semibold text-paid">No unpaid invoices</b>}
              </span>
              {totalFailed > 0 && <span><b className="font-semibold text-late">{formatMoney(totalFailed)}</b> failed</span>}
            </p>
          )}

          <div className="mb-3 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="payment-search" className="sr-only">Search payments</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
              <Input
                id="payment-search"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 sm:flex-1">
              <label htmlFor="payment-status" className="sr-only">Show</label>
              <Select
                id="payment-status"
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="flex-1 sm:w-44 sm:flex-none"
                options={[
                  { value: 'all', label: 'Every status' },
                  { value: 'completed', label: 'Received' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
              {filteredPayments.length > 0 && (
                <Button variant="ghost" onClick={handleExport} className="sm:-mr-3.5 sm:ml-auto">Export CSV</Button>
              )}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            payments.length === 0 ? (
              <EmptyState
                message="No payments recorded yet"
                description="Payments you record, and proofs you approve, show here with a receipt for each."
              />
            ) : (
              <p className="border-t border-rule py-8 text-[15px] text-quiet">No payments match. Try another name, number or status.</p>
            )
          ) : (
            <div className="lg:overflow-x-auto">
              <div className="lg:min-w-[800px]">
                <div className={cn('hidden gap-x-4 py-2 text-[13.5px] text-quiet lg:grid', COLS)}>
                  <span>Payment</span>
                  <span>Tenant</span>
                  <span>Date</span>
                  <span>How</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                  <span className="sr-only">Receipt</span>
                </div>
                <ul>
                  {paginatedPayments.map((payment) => {
                    const place = [payment.property_name, payment.unit_name].filter(Boolean).join(', ');
                    return (
                      <li key={payment.id} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-rule py-3', COLS)}>
                        <div className="min-w-0 lg:order-2">
                          {personLink(payment.tenant_id, payment.tenant_first_name, payment.tenant_last_name)}
                          {place && <span className="hidden truncate text-[13.5px] text-quiet lg:block">{place}</span>}
                        </div>

                        <span className="num text-right text-base font-semibold lg:order-6">{formatMoney(payment.amount)}</span>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px] text-quiet lg:contents lg:text-sm">
                          <span className="num lg:order-1">{payment.payment_number}</span>
                          <span className="num lg:order-3 lg:text-ink">{formatDate(payment.payment_date)}</span>
                          <span className="lg:order-4 lg:text-ink">{methodLabels[payment.method] ?? payment.method}</span>
                          <StatusBadge
                            variant={statusVariantMap[payment.status] ?? 'default'}
                            className={cn('lg:order-5', payment.status === 'completed' && 'max-lg:hidden')}
                          >
                            {statusWords[payment.status] ?? payment.status}
                          </StatusBadge>
                        </div>

                        <div className="text-right lg:order-7">
                          <Link
                            to={`/receipt/${payment.id}`}
                            className="inline-flex min-h-10 items-center text-sm font-semibold text-shell underline underline-offset-[3px] hover:text-paid"
                          >
                            Receipt
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalItems={filteredPayments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {activeTab === 'proofs' && (
        <section className="mt-5">
          {pendingProofs.length === 0 ? (
            <EmptyState
              message="No proofs to review"
              description="When a tenant sends a screenshot from their pay link, it shows here for you to approve or reject."
            />
          ) : (
            <>
              <p className="mb-4 max-w-2xl text-[15px] text-quiet">
                Check each screenshot against your bank. Approving records the payment and marks the invoice paid.
              </p>
              <ul>
                {pendingProofs.map((proof) => {
                  const busy = actionLoading === proof.id;
                  return (
                    <li key={proof.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-rule py-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <button
                        type="button"
                        onClick={() => setImageModal(proof.image_url)}
                        aria-label={`View proof from ${proof.tenant_first_name} ${proof.tenant_last_name}`}
                        className="row-span-2 h-[88px] w-[88px] cursor-zoom-in overflow-hidden border border-rule transition-opacity duration-100 hover:opacity-85 sm:h-[120px] sm:w-[120px]"
                      >
                        <img src={proof.image_url} alt="" className="h-full w-full object-cover" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-4">
                          {personLink(proof.tenant_id, proof.tenant_first_name, proof.tenant_last_name, true)}
                          <span className="num text-base font-semibold">{formatMoney(proof.invoice_amount)}</span>
                        </div>
                        <p className="num text-[13.5px] text-quiet">
                          {proof.invoice_number}, sent {formatDate(proof.created_at)}
                        </p>                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        {rejectingId === proof.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1">
                              <Label htmlFor={`reject-${proof.id}`}>Why are you rejecting it? The tenant sees this.</Label>
                              <Input
                                id={`reject-${proof.id}`}
                                className="mt-1"
                                autoFocus
                                placeholder="Optional"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="destructive" className="flex-1 sm:flex-none" onClick={() => handleReject(proof.id)} disabled={busy}>
                                {busy ? 'Rejecting' : 'Reject proof'}
                              </Button>
                              <Button variant="ghost" onClick={() => { setRejectingId(null); setRejectNote(''); }}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button className="flex-1 sm:flex-none" onClick={() => handleApprove(proof)} disabled={busy}>
                              {busy ? 'Approving' : 'Approve'}
                            </Button>
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setRejectingId(proof.id)} disabled={busy}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Record a payment */}
      <Dialog open={showRecord} onOpenChange={setShowRecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecord} className="space-y-4">
            {recordError && <p role="alert" className="text-sm font-medium text-late">{recordError}</p>}
            <div>
              <Label htmlFor="pay-tenant">Tenant</Label>
              <Select
                id="pay-tenant"
                required
                value={newPayment.tenant_id}
                onValueChange={(val) => setNewPayment({ ...newPayment, tenant_id: val, invoice_id: '' })}
                placeholder="Choose a tenant"
                className="mt-1"
                options={tenants.filter(t => t.unit_name).map(t => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name}`,
                }))}
              />
            </div>
            {newPayment.tenant_id && unpaidInvoices.length > 0 && (
              <div>
                <Label htmlFor="pay-invoice">Which invoice it pays (optional)</Label>
                <Select
                  id="pay-invoice"
                  value={newPayment.invoice_id || '__none__'}
                  onValueChange={(val) => {
                    const realVal = val === '__none__' ? '' : val;
                    const inv = unpaidInvoices.find(i => i.id === realVal);
                    setNewPayment({
                      ...newPayment,
                      invoice_id: realVal,
                      amount: inv ? inv.amount.toString() : newPayment.amount,
                    });
                  }}
                  placeholder="None"
                  className="mt-1"
                  options={[
                    { value: '__none__', label: 'None' },
                    ...unpaidInvoices.map(i => ({
                      value: i.id,
                      label: `${i.invoice_number}, ${formatMoney(i.amount)}, due ${formatDate(i.due_date)}`,
                    })),
                  ]}
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pay-amount">Amount (JMD)</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  inputMode="numeric"
                  required
                  className="num mt-1"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label htmlFor="pay-method">How they paid</Label>
                <Select
                  id="pay-method"
                  value={newPayment.method}
                  onValueChange={(val) => setNewPayment({ ...newPayment, method: val })}
                  className="mt-1"
                  options={[
                    { value: 'bank_transfer', label: 'Bank transfer' },
                    { value: 'card', label: 'Card' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pay-date">Date paid</Label>
                <Input
                  id="pay-date"
                  type="date"
                  className="mt-1"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pay-notes">Note</Label>
                <Input
                  id="pay-notes"
                  className="mt-1"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowRecord(false)}>Cancel</Button>
              <Button type="submit" disabled={recording}>{recording ? 'Saving' : 'Save payment'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Proof image viewer */}
      <Dialog open={!!imageModal} onOpenChange={(open) => { if (!open) setImageModal(null); }}>
        <DialogContent className="max-w-3xl p-3 pt-14">
          <DialogTitle className="absolute left-4 top-5 text-base">Proof of payment</DialogTitle>
          {imageModal && (
            <img src={imageModal} alt="Proof of payment sent by the tenant" className="max-h-[78vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
