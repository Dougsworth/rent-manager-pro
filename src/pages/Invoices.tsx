import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices, createInvoice } from '@/services/invoices';
import { getTenants } from '@/services/tenants';
import type { InvoiceWithTenant, TenantWithDetails } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Search, Download, Loader2, X } from 'lucide-react';
import { exportToCsv } from '@/utils/exportCsv';

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
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Invoice</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="inv-tenant">Tenant</Label>
                <select
                  id="inv-tenant"
                  required
                  value={newInvoice.tenant_id}
                  onChange={(e) => setNewInvoice({ ...newInvoice, tenant_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} — {t.unit_name}
                    </option>
                  ))}
                </select>
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
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
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
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="hidden sm:table-cell py-3 px-4 text-sm font-medium text-blue-600">{invoice.invoice_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {invoice.tenant_first_name} {invoice.tenant_last_name}
                  </td>
                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-600">
                    {invoice.property_name}{invoice.unit_name ? `, ${invoice.unit_name}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{invoice.due_date}</td>
                  <td className="py-3 px-4">
                    <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
