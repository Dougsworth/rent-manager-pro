import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices, createInvoice } from '@/services/invoices';
import { getTenants } from '@/services/tenants';
import type { InvoiceWithTenant, TenantWithDetails } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Download, Loader2, Link } from 'lucide-react';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDate } from '@/utils/formatDate';
import { Pagination, paginate } from '@/components/Pagination';

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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

  const filteredInvoices = invoices.filter(invoice => {
    const tenantName = `${invoice.tenant_first_name} ${invoice.tenant_last_name}`.toLowerCase();
    const matchesSearch = tenantName.includes(searchTerm.toLowerCase()) ||
                         invoice.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedInvoices = paginate(filteredInvoices, currentPage, PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="inv-tenant">Tenant</Label>
              <Select
                id="inv-tenant"
                required
                value={newInvoice.tenant_id}
                onValueChange={(val) => setNewInvoice({ ...newInvoice, tenant_id: val })}
                placeholder="Select a tenant"
                className="mt-1"
                options={tenants.map(t => ({
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="hidden sm:table-cell text-left py-3 px-4 font-medium text-gray-900">Invoice ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant</th>
                <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-gray-900">Property</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="hidden sm:table-cell py-3 px-4 text-sm font-medium text-blue-600">{invoice.invoice_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {invoice.tenant_first_name} {invoice.tenant_last_name}
                  </td>
                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-600">
                    {invoice.property_name}{invoice.unit_name ? `, ${invoice.unit_name}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(invoice.due_date)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                  </td>
                  <td className="py-3 px-4">
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
          <div className="py-8 text-center">
            <p className="text-gray-500">
              {invoices.length === 0 ? 'No invoices yet. Create your first invoice.' : 'No invoices found matching your search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
