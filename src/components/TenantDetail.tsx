import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Loader2 } from "lucide-react";
import { getPaymentsForTenant } from "@/services/payments";
import { formatDate } from "@/utils/formatDate";

interface Tenant {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  rent: number;
  status: "paid" | "pending" | "overdue";
  leaseStart: string;
  leaseEnd: string;
}

interface TenantDetailProps {
  tenant: Tenant;
  tenantId?: string;
  onSendReminder?: () => Promise<void>;
  sendingReminder?: boolean;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

export function TenantDetail({ tenant, tenantId, onSendReminder, sendingReminder }: TenantDetailProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    const id = tenantId ?? String(tenant.id);
    setLoadingPayments(true);
    try {
      const data = await getPaymentsForTenant(id);
      setPayments(data);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{tenant.phone}</span>
          </div>
        </div>
      </div>

      {/* Lease Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Lease Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Unit</span>
            <span className="text-sm text-gray-900">{tenant.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Monthly Rent</span>
            <span className="text-sm font-medium text-gray-900">
              J${tenant.rent.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Lease Period</span>
            <span className="text-sm text-gray-900">
              {tenant.leaseStart ? formatDate(tenant.leaseStart) : '—'} - {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Payment Status</span>
            <StatusBadge variant={tenant.status}>{tenant.status}</StatusBadge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4">
        <Button
          className="w-full"
          disabled={sendingReminder || !onSendReminder}
          onClick={onSendReminder}
        >
          {sendingReminder ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
          ) : (
            'Send Payment Reminder'
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleViewHistory}
          disabled={loadingPayments}
        >
          {loadingPayments ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
          ) : showHistory ? (
            'Hide Payment History'
          ) : (
            'View Payment History'
          )}
        </Button>
      </div>

      {/* Payment History */}
      {showHistory && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      J${Number(p.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(p.payment_date)} &middot; {methodLabels[p.method] ?? p.method}
                    </p>
                  </div>
                  <StatusBadge variant={p.status === 'completed' ? 'paid' : p.status === 'failed' ? 'overdue' : 'pending'}>
                    {p.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
