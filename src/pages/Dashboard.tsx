import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getRecentPayments, getOverdueTenants } from '@/services/dashboard';
import { sendReminder } from '@/services/reminders';
import type { DashboardStats, PaymentWithDetails } from '@/types/app.types';
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, DollarSign, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { SetupBanner } from "@/components/SetupBanner";

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

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
      <SetupBanner />
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description={today}
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Collected</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-2.5 rounded-sm transition-all duration-500 ${
                    i < Math.round(collectionPercentage / 5) ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-blue-600">{collectionPercentage}%</span>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Expected"
          value={formatCurrency(stats.expected)}
          subtext={`${stats.tenantCount} tenants this month`}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats.collected)}
          valueColor="text-emerald-600"
          subtext={collectionPercentage > 0 ? `+${collectionPercentage}% collected` : "No payments yet"}
          subtextColor="text-emerald-500"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          valueColor="text-amber-600"
          subtext={stats.outstanding > 0 ? "Awaiting payment" : "All paid up"}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue > 0 ? `${stats.overdue} tenant${stats.overdue !== 1 ? 's' : ''}` : "0"}
          valueColor={stats.overdue > 0 ? "text-red-500" : "text-slate-900"}
          subtext={stats.overdue > 0 ? "Needs attention" : "No overdue"}
          subtextColor={stats.overdue > 0 ? "text-red-400" : "text-slate-500"}
        />
        </div>
      </div>

      {/* Two Column: Recent Activity + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100/60">
            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/30 p-4 inline-block mb-3">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 bg-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{payment.tenant_first_name} {payment.tenant_last_name?.[0]}.</span>
                        {' — '}
                        <span className="text-slate-500">paid</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(payment.amount)} · {timeAgo(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {recentPayments.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100/60">
              <Link to="/payments" className="text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors duration-150">
                View all payments
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Overdue Tenants */}
        <div className="bg-white rounded-2xl border border-slate-200/60">
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
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 bg-red-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tenant.name}</p>
                          <p className="text-xs text-slate-400">{tenant.unit} · {formatCurrency(tenant.amount)}</p>
                        </div>
                      </div>
                      <StatusBadge variant="overdue">{tenant.daysOverdue}d late</StatusBadge>
                    </div>
                    <div className="flex justify-end">
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
