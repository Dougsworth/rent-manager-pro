import type { Tenant } from "@/pages/Tenants";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";

interface TenantDetailProps {
  tenant: Tenant;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  if (!dateString || dateString === '') {
    return 'Not set';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return 'Not set';
  }
}

interface TenantDetailProps {
  tenant: Tenant;
  onTenantUpdate?: () => void;
  onClose?: () => void;
}

export function TenantDetail({ tenant, onTenantUpdate, onClose }: TenantDetailProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshInvoices, refreshPayments, refreshDashboard } = useData();

  useEffect(() => {
    loadPayments();
  }, [tenant.id]);

  const loadPayments = async () => {
    try {
      const response = await api.getPayments();
      if (response.data) {
        // Filter payments for this tenant
        const tenantPayments = response.data.filter(p => p.tenant === tenant.name);
        setPayments(tenantPayments);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const handleSendReminder = async () => {
    if (!confirm('Send payment reminder to ' + tenant.name + '?')) return;
    
    setLoading(true);
    try {
      await api.sendReminder(tenant.id);
      alert('Reminder sent successfully!');
      // Refresh data
      await refreshInvoices();
    } catch (error) {
      alert('Failed to send reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!confirm('Create new invoice for ' + tenant.name + '?')) return;
    
    setLoading(true);
    try {
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      await api.createInvoice({
        tenantId: tenant.id,
        amount: tenant.rent,
        dueDate: dueDate.toISOString().split('T')[0]
      });
      alert('Invoice created successfully!');
      // Refresh all data to update tenant status
      await Promise.all([
        refreshInvoices(),
        refreshDashboard(),
        onTenantUpdate ? onTenantUpdate() : Promise.resolve()
      ]);
    } catch (error) {
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!confirm('Are you sure you want to remove ' + tenant.name + '? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.deleteTenant(tenant.id);
      alert('Tenant removed successfully!');
      // Refresh all data
      await Promise.all([
        refreshInvoices(),
        refreshPayments(),
        refreshDashboard()
      ]);
      if (onTenantUpdate) onTenantUpdate();
      if (onClose) onClose();
    } catch (error) {
      alert('Failed to remove tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusBadge variant={tenant.status}>{tenant.status}</StatusBadge>
      </div>

      {/* Details Section */}
      <section>
        <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
          Details
        </h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Unit</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.unit}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Rent Amount</dt>
            <dd className="text-sm font-medium text-foreground">{formatCurrency(tenant.rent)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.phone || 'Not provided'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Lease Start</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(tenant.leaseStart)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Lease End</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(tenant.leaseEnd)}</dd>
          </div>
        </dl>
      </section>

      {/* Payment History Section */}
      <section>
        <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
          Payment History
        </h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 py-2 text-foreground">{payment.date}</td>
                    <td className="px-3 py-2 text-right text-success font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button 
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        title={`Download receipt ${payment.receipt}`}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Actions Section */}
      {(tenant.status === "pending" || tenant.status === "overdue") && (
        <section>
          <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
            Actions
          </h3>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSendReminder}
              disabled={loading}
            >
              Send Reminder
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCreateInvoice}
              disabled={loading}
            >
              Create Invoice
            </Button>
          </div>
        </section>
      )}

      {/* Delete */}
      <div className="pt-4 border-t border-border">
        <button 
          className="text-sm text-destructive hover:underline disabled:opacity-50"
          onClick={handleRemoveTenant}
          disabled={loading}
        >
          Remove tenant
        </button>
      </div>
    </div>
  );
}
