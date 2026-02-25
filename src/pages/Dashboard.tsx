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
import { ArrowRight, Loader2, DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate } from '@/utils/formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

export default function Dashboard() {
  const { user, profile } = useAuth();
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
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const firstName = profile?.first_name || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description={today}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Expected"
          value={formatCurrency(stats.expected)}
          subtext={`${stats.tenantCount} tenants this month`}
          icon={DollarSign}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats.collected)}
          subtext={`${collectionPercentage}% collected`}
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          subtext={stats.outstanding > 0 ? "Awaiting payment" : "All paid up"}
          icon={Clock}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue.toString()}
          subtext={stats.overdue > 0 ? "Needs attention" : "No overdue"}
          icon={AlertTriangle}
        />
      </div>

      {/* Collection Progress */}
      <div className="mb-8">
        <ProgressBar
          value={collectionPercentage}
          label="Collection Progress"
          segments={[
            { label: "Collected", value: stats.collected, color: "bg-slate-900" },
            { label: "Pending", value: stats.outstanding, color: "bg-blue-500" },
            { label: "Overdue", value: stats.overdue > 0 ? stats.expected - stats.collected - stats.outstanding : 0, color: "bg-slate-300" },
          ]}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-3 glass rounded-2xl border border-white/60">
          <div className="px-6 py-4 border-b border-slate-100/60">
            <h2 className="text-sm font-semibold text-slate-900">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100/60">
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-slate-400">Tenant</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-slate-400 hidden sm:table-cell">Unit</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-slate-400 hidden md:table-cell">Date</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-slate-400 hidden lg:table-cell">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/30 p-4 inline-block mb-3">
                        <DollarSign className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">No payments recorded yet</p>
                    </td>
                  </tr>
                ) : recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/80 border border-slate-200/60 text-slate-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {(payment.tenant_first_name?.[0] ?? '').toUpperCase()}{(payment.tenant_last_name?.[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{payment.tenant_first_name} {payment.tenant_last_name}</p>
                          <p className="sm:hidden text-xs text-slate-500">{payment.unit_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{payment.unit_name}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{formatDate(payment.payment_date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{methodLabels[payment.method] ?? payment.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-100/60">
            <Link to="/payments" className="text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors duration-150">
              View all payments
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Overdue Tenants */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/60">
          <div className="px-6 py-4 border-b border-slate-100/60">
            <h2 className="text-sm font-semibold text-slate-900">Overdue Tenants</h2>
          </div>
          <div className="p-6">
            {overdueTenants.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/30 p-4 inline-block mb-3">
                  <AlertTriangle className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">All tenants are up to date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 glass-subtle border border-white/50 rounded-xl hover:bg-white/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{tenant.unit}</p>
                      </div>
                      <StatusBadge variant="overdue">{tenant.daysOverdue}d late</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(tenant.amount)}</p>
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
                          'Remind'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {overdueTenants.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100/60">
              <Link to="/tenants?status=overdue" className="text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors duration-150">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
