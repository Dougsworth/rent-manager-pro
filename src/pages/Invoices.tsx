import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices, createInvoice, bulkCreateInvoices } from '@/services/invoices';
import { createInvoiceSchema } from '@/schemas';
import { getTenants } from '@/services/tenants';
import type { InvoiceWithTenant, TenantWithDetails } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { InvoicesSkeleton } from '@/components/skeletons/InvoicesSkeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDate } from '@/utils/formatDate';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Pagination, paginate } from '@/components/Pagination';

interface BulkTenantRow {
  tenant_id: string;
  name: string;
  unit_name: string;
  amount: number;
  selected: boolean;
}

type StatusFilter = 'all' | 'overdue' | 'pending' | 'paid';

const statusWords: Record<string, string> = { paid: 'Paid', pending: 'Pending', overdue: 'Overdue' };

/** Desktop columns. Below lg each row stacks into two lines. */
const COLS = 'lg:grid-cols-[76px_minmax(180px,1fr)_104px_104px_120px_108px]';

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ tenant_id: '', amount: '', due_date: '', description: '' });
  const [showBulk, setShowBulk] = useState(false);
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulking, setBulking] = useState(false);
  const [bulkTenants, setBulkTenants] = useState<BulkTenantRow[]>([]);
  const [bulkSendEmail, setBulkSendEmail] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadData = async () => {
    if (!user) return;
    try {
      const [inv, ten] = await Promise.all([
        getInvoices(user.id),
        getTenants(user.id),
      ]);
      setInvoices(inv);
      setTenants(ten);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const [createError, setCreateError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreateError('');

    const result = createInvoiceSchema.safeParse(newInvoice);
    if (!result.success) {
      setCreateError(result.error.issues[0].message);
      return;
    }

    setCreating(true);
    try {
      await createInvoice(user.id, {
        tenant_id: newInvoice.tenant_id,
        amount: parseInt(newInvoice.amount),
        due_date: newInvoice.due_date,
        description: newInvoice.description,
      });
      setShowCreate(false);
      setNewInvoice({ tenant_id: '', amount: '', due_date: '', description: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setCreateError('That invoice did not save. Check your connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  // Tenants with assigned units (have a rent amount to invoice)
  const invoiceableTenants = tenants.filter(t => t.rent_amount > 0);

  const openBulk = () => {
    // Pre-fill due date to 1st of next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yyyy = nextMonth.getFullYear();
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    setBulkDueDate(`${yyyy}-${mm}-01`);

    const monthLabel = nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    setBulkDescription(`Rent for ${monthLabel}`);

    setBulkTenants(invoiceableTenants.map(t => ({
      tenant_id: t.id,
      name: `${t.first_name} ${t.last_name}`,
      unit_name: t.unit_name,
      amount: t.rent_amount,
      selected: true,
    })));
    setBulkSendEmail(false);
    setShowBulk(true);
  };

  const handleBulkInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bulkDueDate) return;

    const selectedTenants = bulkTenants.filter(t => t.selected && t.amount > 0);
    if (selectedTenants.length === 0) {
      toast('Choose at least one tenant to invoice.', 'warning');
      return;
    }

    setBulking(true);
    try {
      const invoiceData = selectedTenants.map(t => ({
        tenant_id: t.tenant_id,
        amount: t.amount,
        due_date: bulkDueDate,
        description: bulkDescription || 'Monthly rent',
      }));

      const { created, skipped } = await bulkCreateInvoices(user.id, invoiceData);

      // Fire-and-forget email if toggle enabled. Loaded on demand so the page
      // does not pull in the client until it is needed.
      if (bulkSendEmail && created > 0) {
        import('@/lib/supabase')
          .then(({ supabase }) => supabase.functions.invoke('send-invoice-emails', {
            body: { landlord_id: user.id, due_date: bulkDueDate },
          }))
          .catch(err => console.error('Email send failed:', err));
      }

      setShowBulk(false);
      setBulkDueDate('');
      setBulkDescription('');
      setBulkTenants([]);
      await loadData();

      const plural = (n: number) => (n === 1 ? 'invoice' : 'invoices');
      if (created > 0 && skipped > 0) {
        toast(`${created} ${plural(created)} created. ${skipped} skipped because they were already invoiced.`);
      } else if (created > 0) {
        toast(`${created} ${plural(created)} created.`, 'success');
      } else {
        toast('Everyone already has an invoice for this month. Nothing new was created.', 'warning');
      }
    } catch (err) {
      console.error('Bulk invoice failed:', err);
      toast('Those invoices did not save. Check your connection and try again.', 'error');
    } finally {
      setBulking(false);
    }
  };

  const copyLink = async (invoice: InvoiceWithTenant) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${invoice.payment_token}`);
      toast('Pay link copied. Paste it in WhatsApp or an email.', 'success');
    } catch {
      toast('Could not copy the link. Try again.', 'error');
    }
  };

  const handleExport = () => {
    const rows = filteredInvoices.map((inv) => ({
      invoice_number: inv.invoice_number,
      tenant: `${inv.tenant_first_name} ${inv.tenant_last_name}`,
      property: inv.property_name,
      unit: inv.unit_name,
      amount: inv.amount,
      due_date: inv.due_date,
      status: inv.status,
    }));
    exportToCsv('invoices.csv', rows, [
      { key: 'invoice_number', header: 'Invoice ID' },
      { key: 'tenant', header: 'Tenant Name' },
      { key: 'property', header: 'Property' },
      { key: 'unit', header: 'Unit' },
      { key: 'amount', header: 'Amount' },
      { key: 'due_date', header: 'Due Date' },
      { key: 'status', header: 'Status' },
    ]);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const tenantName = `${invoice.tenant_first_name} ${invoice.tenant_last_name}`.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = tenantName.includes(q) ||
                         (invoice.property_name ?? '').toLowerCase().includes(q) ||
                         invoice.invoice_number.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedInvoices = paginate(filteredInvoices, currentPage, PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  if (loading) return <InvoicesSkeleton />;

  const count = (s: string) => invoices.filter(i => i.status === s).length;
  const sum = (list: InvoiceWithTenant[]) => list.reduce((total, i) => total + i.amount, 0);
  const unpaid = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const overdue = invoices.filter(i => i.status === 'overdue');
  const paidAmount = sum(invoices.filter(i => i.status === 'paid'));
  const totalAmount = sum(invoices);

  const tabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: invoices.length },
    { value: 'overdue', label: 'Overdue', count: count('overdue') },
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'paid', label: 'Paid', count: count('paid') },
  ];

  const selectedCount = bulkTenants.filter(t => t.selected).length;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="What each tenant has been billed and whether they have paid."
        action={
          <>
            {invoiceableTenants.length > 0 && (
              <Button variant="outline" onClick={openBulk}>Invoice all tenants</Button>
            )}
            <Button onClick={() => setShowCreate(true)}>Create Invoice</Button>
          </>
        }
      />

      {invoices.length > 0 && (
        <p className="num mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-rule pb-5 text-base">
          <span>
            <b className="text-[22px] font-bold">{formatMoney(sum(unpaid))}</b> unpaid on {unpaid.length} {unpaid.length === 1 ? 'invoice' : 'invoices'}
          </span>
          <span>
            {overdue.length > 0
              ? <b className="font-semibold text-late">{formatMoney(sum(overdue))} overdue</b>
              : <b className="font-semibold text-paid">Nothing overdue</b>}
          </span>
          <span><b className="font-semibold">{formatMoney(paidAmount)}</b> collected of {formatMoney(totalAmount)} invoiced</span>
        </p>
      )}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="invoice-search" className="sr-only">Search invoices</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
          <Input
            id="invoice-search"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {filteredInvoices.length > 0 && (
          <Button variant="ghost" onClick={handleExport} className="-ml-3.5 self-start sm:-mr-3.5 sm:ml-0 sm:self-auto">Export CSV</Button>
        )}
      </div>

      <FilterTabs tabs={tabs} activeTab={statusFilter} onTabChange={setStatusFilter} />

      {filteredInvoices.length === 0 ? (
        invoices.length === 0 ? (
          <EmptyState
            message="No invoices yet"
            description="Invoices you create show here with their pay link and whether they are paid."
            action={invoiceableTenants.length > 0 ? <Button onClick={openBulk}>Invoice all tenants</Button> : undefined}
          />
        ) : (
          <p className="py-8 text-[15px] text-quiet">No invoices match. Try another name, number or status.</p>
        )
      ) : (
        <div className="lg:overflow-x-auto">
          <div className="lg:min-w-[740px]">
            <div className={cn('hidden gap-x-4 py-2 text-[13.5px] text-quiet lg:grid', COLS)}>
              <span>Invoice</span>
              <span>Tenant</span>
              <span>Due</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Pay link</span>
            </div>
            <ul>
              {paginatedInvoices.map((invoice) => {
                const name = `${invoice.tenant_first_name} ${invoice.tenant_last_name}`;
                const late = invoice.status === 'overdue';
                const place = [invoice.property_name, invoice.unit_name].filter(Boolean).join(', ');
                return (
                  <li
                    key={invoice.id}
                    className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-rule py-3', COLS)}
                  >
                    <div className="min-w-0 lg:order-2">
                      {invoice.tenant_id ? (
                        <Link
                          to={`/tenants/${invoice.tenant_id}`}
                          className={cn('block truncate text-base text-ink hover:underline', late ? 'font-semibold' : 'font-medium')}
                        >
                          {invoice.tenant_first_name} {invoice.tenant_last_name}
                        </Link>
                      ) : (
                        <span className={cn('block truncate text-base', late ? 'font-semibold' : 'font-medium')}>{name}</span>
                      )}
                      {place && <span className="hidden truncate text-[13.5px] text-quiet lg:block">{place}</span>}
                    </div>

                    <div className="text-right lg:order-5">
                      <span className="num block text-base font-semibold">{formatMoney(invoice.amount)}</span>
                      {invoice.late_fee_amount != null && invoice.late_fee_amount > 0 && (
                        <span className="num block text-[13.5px] text-late">plus {formatMoney(invoice.late_fee_amount)} late fee</span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px] text-quiet lg:contents lg:text-sm">
                      <span className="num lg:order-1">{invoice.invoice_number}</span>
                      <span className="num lg:order-3 lg:text-ink">
                        <span className="lg:hidden">Due </span>{formatDate(invoice.due_date)}
                      </span>
                      <StatusBadge variant={invoice.status} className="lg:order-4">
                        {statusWords[invoice.status] ?? invoice.status}
                      </StatusBadge>
                    </div>

                    <div className="text-right lg:order-6">
                      {invoice.payment_token && (
                        <button
                          type="button"
                          onClick={() => copyLink(invoice)}
                          className="min-h-10 cursor-pointer whitespace-nowrap text-sm font-semibold text-shell underline underline-offset-[3px] hover:text-paid"
                        >
                          Copy pay link
                        </button>
                      )}
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
        totalItems={filteredInvoices.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Create invoice */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && <p role="alert" className="text-sm font-medium text-late">{createError}</p>}
            <div>
              <Label htmlFor="inv-tenant">Tenant</Label>
              <Select
                id="inv-tenant"
                required
                value={newInvoice.tenant_id}
                onValueChange={(val) => setNewInvoice({ ...newInvoice, tenant_id: val })}
                placeholder="Choose a tenant"
                className="mt-1"
                options={invoiceableTenants.map(t => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name}, ${t.unit_name}`,
                }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="inv-amount">Amount (JMD)</Label>
                <Input
                  id="inv-amount"
                  type="number"
                  inputMode="numeric"
                  required
                  className="num mt-1"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label htmlFor="inv-due">Due date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  required
                  className="mt-1"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="inv-desc">What it is for</Label>
              <Input
                id="inv-desc"
                className="mt-1"
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="Rent for March 2026"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating' : 'Create invoice'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice everyone at once */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pr-8">
            <DialogTitle>Invoice all tenants</DialogTitle>
            <DialogDescription>
              Check the amounts, then create one invoice each. Anyone who already has an unpaid invoice for that month is skipped.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkInvoice} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium">
                <Checkbox
                  checked={bulkTenants.length > 0 && bulkTenants.every(t => t.selected)}
                  onCheckedChange={(checked) => {
                    setBulkTenants(bulkTenants.map(t => ({ ...t, selected: !!checked })));
                  }}
                />
                Everyone
              </label>
              <span className="num text-[13.5px] text-quiet">{selectedCount} of {bulkTenants.length} chosen</span>
            </div>

            <ul className="max-h-60 overflow-y-auto border-b border-rule">
              {bulkTenants.map((t, idx) => (
                <li key={t.tenant_id} className="flex items-center gap-3 border-t border-rule py-2 text-sm">
                  <Checkbox
                    id={`bulk-${t.tenant_id}`}
                    checked={t.selected}
                    onCheckedChange={(checked) => {
                      const updated = [...bulkTenants];
                      updated[idx] = { ...updated[idx], selected: !!checked };
                      setBulkTenants(updated);
                    }}
                  />
                  <label htmlFor={`bulk-${t.tenant_id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate font-medium">{t.name}</span>
                    {t.unit_name && <span className="block truncate text-[13.5px] text-quiet">{t.unit_name}</span>}
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    aria-label={`Amount for ${t.name}`}
                    value={t.amount}
                    onChange={(e) => {
                      const updated = [...bulkTenants];
                      updated[idx] = { ...updated[idx], amount: parseInt(e.target.value) || 0 };
                      setBulkTenants(updated);
                    }}
                    className="num w-28 text-right"
                  />
                </li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bulk-due">Due date</Label>
                <Input
                  id="bulk-due"
                  type="date"
                  required
                  className="mt-1"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bulk-desc">What it is for</Label>
                <Input
                  id="bulk-desc"
                  className="mt-1"
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  placeholder="Rent for March 2026"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-rule pt-4">
              <label htmlFor="bulk-email" className="cursor-pointer">
                <span className="block text-sm font-medium">Email each tenant</span>
                <span className="block text-[13.5px] text-quiet">They get the amount, due date and a pay link.</span>
              </label>
              <Switch id="bulk-email" checked={bulkSendEmail} onCheckedChange={setBulkSendEmail} />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowBulk(false)}>Cancel</Button>
              <Button type="submit" disabled={bulking || selectedCount === 0}>
                {bulking ? 'Creating' : `Create ${selectedCount} ${selectedCount === 1 ? 'invoice' : 'invoices'}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
