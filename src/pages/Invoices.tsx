import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices, createInvoice, bulkCreateInvoices } from '@/services/invoices';
import { createInvoiceSchema } from '@/schemas';
import { getTenants } from '@/services/tenants';
import type { InvoiceWithTenant, TenantWithDetails } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';
import { Plus, Search, Download, Loader2, Link, FileText, Users } from 'lucide-react';
import { InvoicesSkeleton } from '@/components/skeletons/InvoicesSkeleton';
import { DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDate } from '@/utils/formatDate';
import { Pagination, paginate } from '@/components/Pagination';

interface BulkTenantRow {
  tenant_id: string;
  name: string;
  unit_name: string;
  amount: number;
  selected: boolean;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    } finally {
      setCreating(false);
    }
  };

  // Tenants with assigned units (have a rent amount to invoice)
  const invoiceableTenants = tenants.filter(t => t.rent_amount > 0);

  const handleBulkInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bulkDueDate) return;

    const selectedTenants = bulkTenants.filter(t => t.selected && t.amount > 0);
    if (selectedTenants.length === 0) {
      toast('Please select at least one tenant.', 'warning');
      return;
    }

    setBulking(true);
    try {
      const invoiceData = selectedTenants.map(t => ({
        tenant_id: t.tenant_id,
        amount: t.amount,
        due_date: bulkDueDate,
        description: bulkDescription || 'Monthly Rent',
      }));

      const { created, skipped } = await bulkCreateInvoices(user.id, invoiceData);

      // Fire-and-forget email if toggle enabled
      if (bulkSendEmail && created > 0) {
        supabase.functions.invoke('send-invoice-emails', {
          body: { landlord_id: user.id, due_date: bulkDueDate },
        }).catch(err => console.error('Email send failed:', err));
      }

      setShowBulk(false);
      setBulkDueDate('');
      setBulkDescription('');
      setBulkTenants([]);
      await loadData();

      if (created > 0 && skipped > 0) {
        toast(`${created} invoices created, ${skipped} skipped (already invoiced).`);
      } else if (created > 0) {
        toast(`${created} invoices created successfully!`, 'success');
      } else {
        toast('All tenants already have invoices for this period.', 'warning');
      }
    } catch (err) {
      console.error('Bulk invoice failed:', err);
      toast('Failed to create invoices. Please try again.', 'error');
    } finally {
      setBulking(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const tenantName = `${invoice.tenant_first_name} ${invoice.tenant_last_name}`.toLowerCase();
    const matchesSearch = tenantName.includes(searchTerm.toLowerCase()) ||
                         invoice.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedInvoices = paginate(filteredInvoices, currentPage, PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  if (loading) return <InvoicesSkeleton />;

  const invoiceCounts = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };
  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and manage rent invoices"
        action={
          <div className="flex gap-2">
            {invoiceableTenants.length > 0 && (
              <Button variant="outline" onClick={() => {
                // Pre-fill due date to 1st of next month
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const yyyy = nextMonth.getFullYear();
                const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
                setBulkDueDate(`${yyyy}-${mm}-01`);

                const monthLabel = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
                setBulkDescription(`Monthly Rent — ${monthLabel}`);

                // Initialize tenant rows
                setBulkTenants(invoiceableTenants.map(t => ({
                  tenant_id: t.id,
                  name: `${t.first_name} ${t.last_name}`,
                  unit_name: t.unit_name,
                  amount: t.rent_amount,
                  selected: true,
                })));
                setBulkSendEmail(false);
                setShowBulk(true);
              }}>
                <Users className="h-4 w-4 mr-2" />
                Invoice All
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          label="Total Invoiced"
          value={formatCurrency(totalAmount)}
          subtext={`${invoiceCounts.total} invoices`}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(paidAmount)}
          valueColor="text-emerald-600"
          subtext={invoiceCounts.paid > 0 ? `${invoiceCounts.paid} paid` : "No payments yet"}
          subtextColor="text-emerald-500"
        />
        <StatCard
          label="Pending"
          value={String(invoiceCounts.pending)}
          valueColor="text-amber-600"
          subtext={invoiceCounts.pending > 0 ? "Awaiting payment" : "None pending"}
        />
        <StatCard
          label="Overdue"
          value={String(invoiceCounts.overdue)}
          valueColor={invoiceCounts.overdue > 0 ? "text-red-500" : "text-slate-900"}
          subtext={invoiceCounts.overdue > 0 ? "Needs attention" : "All on time"}
          subtextColor={invoiceCounts.overdue > 0 ? "text-red-400" : "text-slate-500"}
        />
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {createError}
              </div>
            )}
            <div>
              <Label htmlFor="inv-tenant">Tenant</Label>
              <Select
                id="inv-tenant"
                required
                value={newInvoice.tenant_id}
                onValueChange={(val) => setNewInvoice({ ...newInvoice, tenant_id: val })}
                placeholder="Select a tenant"
                className="mt-1"
                options={invoiceableTenants.map(t => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name} — ${t.unit_name}`,
                }))}
              />
            </div>
            <div>
              <Label htmlFor="inv-amount">Amount (JMD)</Label>
              <Input
                id="inv-amount"
                type="number"
                required
                value={newInvoice.amount}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                placeholder="e.g. 45000"
              />
            </div>
            <div>
              <Label htmlFor="inv-due">Due Date</Label>
              <Input
                id="inv-due"
                type="date"
                required
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inv-desc">Description</Label>
              <Input
                id="inv-desc"
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="e.g. Monthly Rent — March 2026"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Invoice Modal */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice All Tenants</DialogTitle>
            <DialogDescription>
              Select tenants and customize amounts. Tenants who already have
              a pending or overdue invoice for the same month will be skipped.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkInvoice} className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <Checkbox
                  checked={bulkTenants.length > 0 && bulkTenants.every(t => t.selected)}
                  onCheckedChange={(checked) => {
                    setBulkTenants(bulkTenants.map(t => ({ ...t, selected: !!checked })));
                  }}
                />
                Select All
              </label>
              <span className="text-xs text-slate-500">
                {bulkTenants.filter(t => t.selected).length} of {bulkTenants.length} selected
              </span>
            </div>

            {/* Tenant Rows */}
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {bulkTenants.map((t, idx) => (
                <div key={t.tenant_id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Checkbox
                    checked={t.selected}
                    onCheckedChange={(checked) => {
                      const updated = [...bulkTenants];
                      updated[idx] = { ...updated[idx], selected: !!checked };
                      setBulkTenants(updated);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-700">{t.name}</span>
                    <span className="text-slate-400 ml-1">— {t.unit_name}</span>
                  </div>
                  <Input
                    type="number"
                    value={t.amount}
                    onChange={(e) => {
                      const updated = [...bulkTenants];
                      updated[idx] = { ...updated[idx], amount: parseInt(e.target.value) || 0 };
                      setBulkTenants(updated);
                    }}
                    className="w-28 h-8 text-sm text-right"
                  />
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="bulk-due">Due Date</Label>
              <Input
                id="bulk-due"
                type="date"
                required
                value={bulkDueDate}
                onChange={(e) => setBulkDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bulk-desc">Description</Label>
              <Input
                id="bulk-desc"
                value={bulkDescription}
                onChange={(e) => setBulkDescription(e.target.value)}
                placeholder="e.g. Monthly Rent — March 2026"
              />
            </div>

            {/* Email Toggle */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-700">Send email notifications</p>
                <p className="text-xs text-slate-500">Notify tenants about their new invoices</p>
              </div>
              <Switch checked={bulkSendEmail} onCheckedChange={setBulkSendEmail} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBulk(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={bulking || bulkTenants.filter(t => t.selected).length === 0}>
                {bulking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create {bulkTenants.filter(t => t.selected).length} Invoices
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-2xl border border-slate-200/60">
        {/* Search / Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 border-b border-slate-100/60 px-6 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-40"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
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
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="hidden sm:table-cell text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Invoice ID</th>
                <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Tenant</th>
                <th className="hidden md:table-cell text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Property</th>
                <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Amount</th>
                <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Due Date</th>
                <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider text-slate-400">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="hidden sm:table-cell py-3 px-6 text-sm font-mono text-slate-600">{invoice.invoice_number}</td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-900">
                    {invoice.tenant_first_name} {invoice.tenant_last_name}
                  </td>
                  <td className="hidden md:table-cell py-3 px-6 text-sm text-slate-500">
                    {invoice.property_name}{invoice.unit_name ? `, ${invoice.unit_name}` : ''}
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.amount)}
                    {invoice.late_fee_amount != null && invoice.late_fee_amount > 0 && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        +{formatCurrency(invoice.late_fee_amount)} late fee
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500">{formatDate(invoice.due_date)}</td>
                  <td className="py-3 px-6">
                    <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                  </td>
                  <td className="py-3 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/pay/${invoice.payment_token}`;
                        navigator.clipboard.writeText(url).then(() => {
                          toast('Payment link copied to clipboard.');
                        });
                      }}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredInvoices.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        {filteredInvoices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-xl border border-dashed border-slate-300 p-4 mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">
              {invoices.length === 0 ? 'No invoices yet' : 'No results found'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {invoices.length === 0 ? 'Create your first invoice to get started.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
