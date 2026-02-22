import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPayments, createPayment } from '@/services/payments';
import { getTenants } from '@/services/tenants';
import { getInvoices } from '@/services/invoices';
import type { PaymentWithDetails, TenantWithDetails, InvoiceWithTenant } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, DollarSign, Loader2, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

const statusVariantMap: Record<string, 'paid' | 'pending' | 'overdue'> = {
  completed: 'paid',
  pending: 'pending',
  failed: 'overdue',
};

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRecord, setShowRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [newPayment, setNewPayment] = useState({ tenant_id: '', invoice_id: '', amount: '', method: 'bank_transfer', payment_date: '', notes: '' });

  const loadData = async () => {
    if (!user) return;
    try {
      const [p, t, i] = await Promise.all([
        getPayments(user.id),
        getTenants(user.id),
        getInvoices(user.id),
      ]);
      setPayments(p);
      setTenants(t);
      setInvoices(i);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRecording(true);
    try {
      await createPayment(user.id, {
        tenant_id: newPayment.tenant_id,
        invoice_id: newPayment.invoice_id || null,
        amount: parseInt(newPayment.amount),
        method: newPayment.method as any,
        payment_date: newPayment.payment_date || undefined,
        notes: newPayment.notes,
      });
      setShowRecord(false);
      setNewPayment({ tenant_id: '', invoice_id: '', amount: '', method: 'bank_transfer', payment_date: '', notes: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setRecording(false);
    }
  };

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFailed = payments
    .filter(p => p.status === 'failed')
    .reduce((sum, p) => sum + p.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const thisMonth = payments
    .filter(p => p.status === 'completed' && p.payment_date >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(payment => {
    const tenantName = `${payment.tenant_first_name} ${payment.tenant_last_name}`.toLowerCase();
    const matchesSearch = tenantName.includes(searchTerm.toLowerCase()) ||
                         payment.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter unpaid invoices for the selected tenant
  const unpaidInvoices = invoices.filter(i => i.tenant_id === newPayment.tenant_id && i.status !== 'paid');

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
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowRecord(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecord && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowRecord(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowRecord(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRecord} className="space-y-4">
              <div>
                <Label htmlFor="pay-tenant">Tenant</Label>
                <select
                  id="pay-tenant"
                  required
                  value={newPayment.tenant_id}
                  onChange={(e) => setNewPayment({ ...newPayment, tenant_id: e.target.value, invoice_id: '' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              {newPayment.tenant_id && unpaidInvoices.length > 0 && (
                <div>
                  <Label htmlFor="pay-invoice">Link to Invoice (optional)</Label>
                  <select
                    id="pay-invoice"
                    value={newPayment.invoice_id}
                    onChange={(e) => {
                      const inv = unpaidInvoices.find(i => i.id === e.target.value);
                      setNewPayment({
                        ...newPayment,
                        invoice_id: e.target.value,
                        amount: inv ? inv.amount.toString() : newPayment.amount,
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {unpaidInvoices.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.invoice_number} — {formatCurrency(i.amount)} (due {i.due_date})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="pay-amount">Amount (JMD)</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  required
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="e.g. 45000"
                />
              </div>
              <div>
                <Label htmlFor="pay-method">Method</Label>
                <select
                  id="pay-method"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pay-date">Payment Date</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pay-notes">Notes</Label>
                <Input
                  id="pay-notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRecord(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={recording}>
                  {recording && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Record
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFailed)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonth)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-gray-900">Payment ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant</th>
                <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-gray-900">Property</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-gray-900">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="hidden md:table-cell py-3 px-4 text-sm font-medium text-blue-600">{payment.payment_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {payment.tenant_first_name} {payment.tenant_last_name}
                  </td>
                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-600">
                    {payment.property_name}{payment.unit_name ? `, ${payment.unit_name}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                  <td className="hidden sm:table-cell py-3 px-4 text-sm text-gray-600">{payment.payment_date}</td>
                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-600">{methodLabels[payment.method] ?? payment.method}</td>
                  <td className="py-3 px-4">
                    <StatusBadge variant={statusVariantMap[payment.status] ?? 'default'}>
                      {payment.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/receipt/${payment.id}`}>
                      <Button variant="outline" size="sm">Receipt</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              {payments.length === 0 ? 'No payments recorded yet.' : 'No payments found matching your search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
