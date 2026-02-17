import type { Tenant } from "@/pages/Tenants";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { api } from "@/services/api";
import { sendPaymentReminder } from "@/services/emailService";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface TenantDetailProps {
  tenant: Tenant;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  // Handle null, undefined, empty string, or "None" values
  if (!dateString || dateString === '' || dateString === 'None' || dateString === 'null' || dateString === 'undefined') {
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
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLeaseStart, setEditingLeaseStart] = useState(false);
  const [editingLeaseEnd, setEditingLeaseEnd] = useState(false);
  const [tempLeaseStart, setTempLeaseStart] = useState(tenant.leaseStart);
  const [tempLeaseEnd, setTempLeaseEnd] = useState(tenant.leaseEnd);
  
  // Update temp values when tenant prop changes
  useEffect(() => {
    setTempLeaseStart(tenant.leaseStart);
    setTempLeaseEnd(tenant.leaseEnd);
  }, [tenant.leaseStart, tenant.leaseEnd]);

  useEffect(() => {
    loadPayments();
    loadReminders();
  }, [tenant.id]);

  const loadPayments = async () => {
    try {
      const response = await api.getPayments();
      if (response.data) {
        const tenantPayments = response.data.filter(p => p.tenant === tenant.name);
        setPayments(tenantPayments);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await api.getReminderHistory(tenant.id);
      if (response.data?.results) {
        setReminders(response.data.results);
      }
    } catch {
      // Silently fail - reminders are not critical
    }
  };

  const handleSendReminder = async () => {
    if (!confirm(`Send payment reminder to ${tenant.name}?`)) return;
    
    setLoading(true);
    try {
      // Send reminder via backend (which will send email via Resend)
      const response = await api.sendReminder(tenant.id);
      
      if (response.data?.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data?.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Reminder error:', error);
      toast.error('Failed to send reminder. Please check your connection and try again.');
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
      toast.success('Invoice created successfully!');
      if (onTenantUpdate) await onTenantUpdate();
    } catch {
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!confirm('Are you sure you want to remove ' + tenant.name + '? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.deleteTenant(tenant.id);
      toast.success('Tenant removed successfully!');
      if (onTenantUpdate) await onTenantUpdate();
      if (onClose) onClose();
    } catch {
      toast.error('Failed to remove tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeaseStart = async () => {
    if (!tempLeaseStart) return;
    
    setLoading(true);
    try {
      const response = await api.updateTenant(tenant.id, { leaseStart: tempLeaseStart });
      
      if (response.error) {
        toast.error('Failed to update lease start date: ' + response.error);
        return;
      }

      toast.success('Lease start date updated successfully!');
      setEditingLeaseStart(false);
      if (onTenantUpdate) await onTenantUpdate();
    } catch {
      toast.error('Failed to update lease start date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeaseEnd = async () => {
    if (!tempLeaseEnd) return;
    
    setLoading(true);
    try {
      const response = await api.updateTenant(tenant.id, { leaseEnd: tempLeaseEnd });
      
      if (response.error) {
        toast.error('Failed to update lease end date: ' + response.error);
        return;
      }

      toast.success('Lease end date updated successfully!');
      setEditingLeaseEnd(false);
      if (onTenantUpdate) await onTenantUpdate();
    } catch {
      toast.error('Failed to update lease end date. Please try again.');
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
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Lease Start</dt>
            <dd className="text-sm font-medium text-foreground flex items-center gap-2">
              {editingLeaseStart ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={tempLeaseStart}
                    onChange={(e) => setTempLeaseStart(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1 py-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <button
                    onClick={handleSaveLeaseStart}
                    className="text-xs text-green-600 hover:underline"
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingLeaseStart(false);
                      setTempLeaseStart(tenant.leaseStart);
                    }}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {formatDate(tenant.leaseStart)}
                  {(!tenant.leaseStart || tenant.leaseStart === '') && (
                    <span
                      onClick={() => setEditingLeaseStart(true)}
                      className="text-xs text-blue-600 ml-2 cursor-pointer hover:underline"
                    >
                      Add date
                    </span>
                  )}
                </>
              )}
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Lease End</dt>
            <dd className="text-sm font-medium text-foreground flex items-center gap-2">
              {editingLeaseEnd ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={tempLeaseEnd}
                    onChange={(e) => setTempLeaseEnd(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1 py-1"
                    min={tempLeaseStart || new Date().toISOString().split('T')[0]}
                  />
                  <button
                    onClick={handleSaveLeaseEnd}
                    className="text-xs text-green-600 hover:underline"
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingLeaseEnd(false);
                      setTempLeaseEnd(tenant.leaseEnd);
                    }}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {formatDate(tenant.leaseEnd)}
                  {(!tenant.leaseEnd || tenant.leaseEnd === '') && (
                    <span
                      onClick={() => setEditingLeaseEnd(true)}
                      className="text-xs text-blue-600 ml-2 cursor-pointer hover:underline"
                    >
                      Add date
                    </span>
                  )}
                </>
              )}
            </dd>
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
                        onClick={async () => {
                          try {
                            await api.downloadReceipt(payment.id);
                          } catch {
                            const { toast } = await import('sonner');
                            toast.error('Failed to download receipt');
                          }
                        }}
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

      {/* Reminder History Section */}
      {reminders.length > 0 && (
        <section>
          <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
            Reminder History
          </h3>
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">
              {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} sent
              {reminders[0]?.sent_date && ` · Last: ${new Date(reminders[0].sent_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reminders.slice(0, 5).map((reminder) => (
                  <tr key={reminder.id}>
                    <td className="px-3 py-2 text-foreground">
                      {new Date(reminder.sent_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">{reminder.reminder_type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{reminder.invoice_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
