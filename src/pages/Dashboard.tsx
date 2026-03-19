import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getRecentPayments, getOverdueTenants } from '@/services/dashboard';
import { sendReminder } from '@/services/reminders';
import type { DashboardStats, PaymentWithDetails } from '@/types/app.types';
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, DollarSign, AlertTriangle, TrendingUp, Users, Receipt, Clock } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useToast } from "@/components/ui/toast";

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
  if (diffMins < 1) return 'Just now';
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

  if (loading) return <DashboardSkeleton />;

  const firstName = profile?.first_name || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/tenants" className="block group">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Expected</p>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(stats.expected)}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{stats.tenantCount} tenants this month</p>
            </div>
          </div>
        </Link>

        <Link to="/payments" className="block group">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Collected</p>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-emerald-600">{formatCurrency(stats.collected)}</p>
              <p className="text-xs font-medium text-emerald-500 mt-1">
                {collectionPercentage > 0 ? `${collectionPercentage}% collected` : "No payments yet"}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/invoices" className="block group">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Outstanding</p>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-amber-600">{formatCurrency(stats.outstanding)}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {stats.outstanding > 0 ? "Awaiting payment" : "All paid up"}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/tenants" className="block group">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5 hover:border-red-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Overdue</p>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${stats.overdue > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                {stats.overdue > 0 ? `${stats.overdue}` : "0"}
              </p>
              <p className={`text-xs font-medium mt-1 ${stats.overdue > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {stats.overdue > 0 ? `${stats.overdue} tenant${stats.overdue !== 1 ? 's' : ''} need attention` : "No overdue"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link to="/invoices">
          <Button variant="outline" size="sm" className="rounded-full px-4 text-xs font-medium">
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Create Invoice
          </Button>
        </Link>
        <Link to="/tenants">
          <Button variant="outline" size="sm" className="rounded-full px-4 text-xs font-medium">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Add Tenant
          </Button>
        </Link>
        <Link to="/payments">
          <Button variant="outline" size="sm" className="rounded-full px-4 text-xs font-medium">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Record Payment
          </Button>
        </Link>
      </div>

      {/* Two Column: Recent Activity + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            {recentPayments.length > 0 && (
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Last 5</span>
            )}
          </div>
          <div className="p-6">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 p-4 inline-block mb-3">
                  <DollarSign className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No activity yet</p>
                <p className="text-xs text-slate-300 mt-1">Payments will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{payment.tenant_first_name} {payment.tenant_last_name}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(payment.amount)} · {payment.property_name}{payment.unit_name ? `, ${payment.unit_name}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium shrink-0">
                      {timeAgo(payment.payment_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {recentPayments.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100/60 bg-slate-50/30">
              <Link to="/payments" className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors duration-150">
                View all payments
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Overdue Tenants */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Overdue Tenants</h2>
            {overdueTenants.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {overdueTenants.length} overdue
              </span>
            )}
          </div>
          <div className="p-6">
            {overdueTenants.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 p-4 inline-block mb-3">
                  <AlertTriangle className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">All tenants are up to date</p>
                <p className="text-xs text-slate-300 mt-1">No overdue payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-500">
                            {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
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
                        className="text-xs"
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
            <div className="px-6 py-3 border-t border-slate-100/60 bg-slate-50/30">
              <Link to="/tenants?status=overdue" className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors duration-150">
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
