import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getRecentPayments, getOverdueTenants } from '@/services/dashboard';
import { sendReminder } from '@/services/reminders';
import type { DashboardStats, PaymentWithDetails } from '@/types/app.types';
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function getCollectionVariant(percentage: number): "success" | "warning" | "danger" {
  if (percentage >= 70) return "success";
  if (percentage >= 40) return "warning";
  return "danger";
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({ expected: 0, collected: 0, outstanding: 0, overdue: 0, tenantCount: 0 });
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([]);
  const [overdueTenants, setOverdueTenants] = useState<{ id: string; tenant_id: string; invoice_id: string; name: string; unit: string; amount: number; daysOverdue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [s, p, o] = await Promise.all([
          getDashboardStats(user.id),
          getRecentPayments(user.id),
          getOverdueTenants(user.id),
        ]);
        setStats(s);
        setRecentPayments(p);
        setOverdueTenants(o);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSendReminder = async (tenantId: string, invoiceId: string) => {
    setSendingReminder(invoiceId);
    try {
      const result = await sendReminder(tenantId, invoiceId);
      if (result?.skipped) {
        toast('Reminders are disabled in notification settings.', 'error');
      } else {
        toast('Reminder sent successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to send reminder:', err);
      toast('Failed to send reminder. Please try again.', 'error');
    } finally {
      setSendingReminder(null);
    }
  };

  const collectionPercentage = stats.expected > 0
    ? Math.round((stats.collected / stats.expected) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Expected"
          value={formatCurrency(stats.expected)}
          subtext={`${stats.tenantCount} tenants this month`}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats.collected)}
          subtext={`${collectionPercentage}% collected`}
          subtextVariant={getCollectionVariant(collectionPercentage)}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          subtext={`${stats.tenantCount - (recentPayments.length)} pending`}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue.toString()}
          subtext={stats.overdue > 0 ? "Needs attention" : "All good"}
          subtextVariant={stats.overdue > 0 ? "danger" : "success"}
        />
      </div>

      {/* Collection Progress */}
      <div className="mb-6">
        <ProgressBar value={collectionPercentage} label="Collection Progress" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-3 bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">Tenant</th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden sm:table-cell">Unit</th>
                  <th className="px-5 py-3 text-right text-xs uppercase font-medium tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden lg:table-cell">Method</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No payments recorded yet
                    </td>
                  </tr>
                ) : recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-secondary transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">
                      {payment.tenant_first_name} {payment.tenant_last_name}
                      <span className="sm:hidden text-xs text-muted-foreground block">{payment.unit_name}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{payment.unit_name}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-success">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{payment.payment_date}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{methodLabels[payment.method] ?? payment.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border">
            <Link to="/payments" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all payments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Overdue Tenants */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Overdue Tenants</h2>
          </div>
          <div className="p-5">
            {overdueTenants.length === 0 ? (
              <p className="text-sm text-success text-center py-4">All tenants are current</p>
            ) : (
              <div className="space-y-4">
                {overdueTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.unit}</p>
                      </div>
                      <StatusBadge variant="overdue">{tenant.daysOverdue} days late</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(tenant.amount)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={sendingReminder === tenant.invoice_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReminder(tenant.tenant_id, tenant.invoice_id);
                        }}
                      >
                        {sendingReminder === tenant.invoice_id ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sending...</>
                        ) : (
                          'Send Reminder'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {overdueTenants.length > 0 && (
            <div className="px-5 py-3 border-t border-border">
              <Link to="/tenants?status=overdue" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
