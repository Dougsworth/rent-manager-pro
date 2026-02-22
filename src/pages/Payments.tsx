import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPayments, createPayment } from '@/services/payments';
import { getTenants } from '@/services/tenants';
import { getInvoices } from '@/services/invoices';
import { getProofsForLandlord, approveProof, rejectProof } from '@/services/paymentProofs';
import type { PaymentWithDetails, TenantWithDetails, InvoiceWithTenant, PaymentProofWithDetails } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, DollarSign, Loader2, Plus, X, Download, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCsv } from '@/utils/exportCsv';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/utils/formatDate';
import { Pagination, paginate } from '@/components/Pagination';

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
  const [proofs, setProofs] = useState<PaymentProofWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRecord, setShowRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [newPayment, setNewPayment] = useState({ tenant_id: '', invoice_id: '', amount: '', method: 'bank_transfer', payment_date: '', notes: '' });
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

  const handleApprove = async (proof: PaymentProofWithDetails) => {
    if (!user) return;
    setActionLoading(proof.id);
    try {
      await approveProof(proof.id, user.id, proof.invoice_id, proof.tenant_id, proof.invoice_amount);
      toast('Payment proof approved successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to approve proof:', err);
      toast('Failed to approve proof.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proofId: string) => {
    setActionLoading(proofId);
    try {
      await rejectProof(proofId, rejectNote);
      toast('Payment proof rejected.');
      setRejectingId(null);
      setRejectNote('');
      await loadData();
    } catch (err) {
      console.error('Failed to reject proof:', err);
      toast('Failed to reject proof.', 'error');
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

  const paginatedPayments = paginate(filteredPayments, currentPage, PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

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
          <Button onClick={() => setShowRecord(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Payments
        </button>
        <button
          onClick={() => setActiveTab('proofs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'proofs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending Proofs
          {pendingProofs.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingProofs.length}
            </span>
          )}
        </button>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={showRecord} onOpenChange={setShowRecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecord} className="space-y-4">
            <div>
              <Label htmlFor="pay-tenant">Tenant</Label>
              <Select
                id="pay-tenant"
                required
                value={newPayment.tenant_id}
                onValueChange={(val) => setNewPayment({ ...newPayment, tenant_id: val, invoice_id: '' })}
                placeholder="Select a tenant"
                className="mt-1"
                options={tenants.map(t => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name}`,
                }))}
              />
            </div>
            {newPayment.tenant_id && unpaidInvoices.length > 0 && (
              <div>
                <Label htmlFor="pay-invoice">Link to Invoice (optional)</Label>
                <Select
                  id="pay-invoice"
                  value={newPayment.invoice_id}
                  onValueChange={(val) => {
                    const inv = unpaidInvoices.find(i => i.id === val);
                    setNewPayment({
                      ...newPayment,
                      invoice_id: val,
                      amount: inv ? inv.amount.toString() : newPayment.amount,
                    });
                  }}
                  placeholder="None"
                  className="mt-1"
                  options={[
                    { value: '', label: 'None' },
                    ...unpaidInvoices.map(i => ({
                      value: i.id,
                      label: `${i.invoice_number} — ${formatCurrency(i.amount)} (due ${i.due_date})`,
                    })),
                  ]}
                />
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
              <Select
                id="pay-method"
                value={newPayment.method}
                onValueChange={(val) => setNewPayment({ ...newPayment, method: val })}
                className="mt-1"
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'card', label: 'Card' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'other', label: 'Other' },
                ]}
              />
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
              <Button type="submit" className="flex-1" disabled={recording}>
                {recording && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Enlarge Modal */}
      <Dialog open={!!imageModal} onOpenChange={(open) => { if (!open) setImageModal(null); }}>
        <DialogContent className="max-w-3xl p-2 bg-transparent border-none shadow-none">
          {imageModal && (
            <img src={imageModal} alt="Payment proof" className="max-h-[85vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {activeTab === 'payments' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFailed)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonth)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    className="w-40"
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'failed', label: 'Failed' },
                    ]}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
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
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="hidden md:table-cell py-3 px-4 text-sm font-medium text-blue-600">{payment.payment_number}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {payment.tenant_first_name} {payment.tenant_last_name}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-600">
                        {payment.property_name}{payment.unit_name ? `, ${payment.unit_name}` : ''}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                      <td className="hidden sm:table-cell py-3 px-4 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
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

            <Pagination
              currentPage={currentPage}
              totalItems={filteredPayments.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />

            {filteredPayments.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  {payments.length === 0 ? 'No payments recorded yet.' : 'No payments found matching your search.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'proofs' && (
        <div className="space-y-4">
          {pendingProofs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending payment proofs to review.</p>
            </div>
          ) : (
            pendingProofs.map((proof) => (
              <div key={proof.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image thumbnail */}
                  <button
                    onClick={() => setImageModal(proof.image_url)}
                    className="flex-shrink-0 w-full sm:w-40 h-40 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={proof.image_url}
                      alt="Payment proof"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {proof.tenant_first_name} {proof.tenant_last_name}
                      </h3>
                      <StatusBadge variant="pending">pending</StatusBadge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Invoice: <span className="font-medium text-gray-900">{proof.invoice_number}</span></p>
                      <p>Amount: <span className="font-medium text-gray-900">{formatCurrency(proof.invoice_amount)}</span></p>
                      <p>Uploaded: {formatDate(proof.created_at)}</p>
                    </div>

                    {/* Actions */}
                    {rejectingId === proof.id ? (
                      <div className="space-y-2 pt-2">
                        <Input
                          placeholder="Reason for rejection (optional)"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setRejectingId(null); setRejectNote(''); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(proof.id)}
                            disabled={actionLoading === proof.id}
                          >
                            {actionLoading === proof.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          onClick={() => handleApprove(proof)}
                          disabled={actionLoading === proof.id}
                        >
                          {actionLoading === proof.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => setRejectingId(proof.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
