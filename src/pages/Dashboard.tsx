import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Send } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Stats {
  expected: number;
  collected: number;
  outstanding: number;
  overdue: number;
  pending: number;
  tenantCount: number;
}

interface Payment {
  id: number;
  tenant: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
}

interface OverdueTenant {
  id: number;
  name: string;
  unit: string;
  amount: number;
  daysOverdue: number;
  lastReminderDate: string | null;
  reminderCount: number;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function getCollectionVariant(percentage: number): "success" | "warning" | "danger" {
  if (percentage >= 70) return "success";
  if (percentage >= 40) return "warning";
  return "danger";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    expected: 0,
    collected: 0,
    outstanding: 0,
    overdue: 0,
    pending: 0,
    tenantCount: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [overdueTenants, setOverdueTenants] = useState<OverdueTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingBulk, setSendingBulk] = useState(false);

  const collectionPercentage = stats.expected > 0 
    ? Math.round((stats.collected / stats.expected) * 100) 
    : 0;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes, overdueRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentPayments(),
        api.getOverdueTenants(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (paymentsRes.data) setRecentPayments(paymentsRes.data);
      if (overdueRes.data) setOverdueTenants(overdueRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Dashboard" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => navigate('/tenants')} 
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          title="Click to view all tenants"
        >
          <StatCard
            label="Expected"
            value={formatCurrency(stats.expected)}
            subtext={`${stats.tenantCount} tenants this month`}
          />
        </div>
        <div 
          onClick={() => navigate('/payments')} 
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          title="Click to view payments"
        >
          <StatCard
            label="Collected"
            value={formatCurrency(stats.collected)}
            subtext={`${collectionPercentage}% collected`}
            subtextVariant={getCollectionVariant(collectionPercentage)}
          />
        </div>
        <div 
          onClick={() => navigate('/invoices')} 
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          title="Click to view invoices"
        >
          <StatCard
            label="Outstanding"
            value={formatCurrency(stats.outstanding)}
            subtext={`${stats.pending} pending`}
          />
        </div>
        <div 
          onClick={() => navigate('/tenants?status=overdue')} 
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          title="Click to view overdue tenants"
        >
          <StatCard
            label="Overdue"
            value={stats.overdue.toString()}
            subtext={stats.overdue > 0 ? "Needs attention" : "All good"}
            subtextVariant={stats.overdue > 0 ? "danger" : "success"}
          />
        </div>
      </div>

      {/* Collection Progress */}
      <div 
        onClick={() => navigate('/payments')} 
        className="mb-8 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Collection Progress</h2>
        <ProgressBar value={collectionPercentage} label="" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatCurrency(stats.collected)} collected</span>
          <span>{formatCurrency(stats.expected)} expected</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-transparent">
            <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
            <p className="text-sm text-muted-foreground mt-1">Latest payment activity</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">
                    Tenant
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden sm:table-cell">
                    Unit
                  </th>
                  <th className="px-5 py-3 text-right text-xs uppercase font-medium tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden lg:table-cell">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-muted-foreground">
                        <p className="text-sm">No recent payments</p>
                        <p className="text-xs mt-1">Payment activity will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentPayments.filter(p => p.amount > 0).map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-foreground">
                        <div className="font-medium">{payment.tenant}</div>
                        <span className="sm:hidden text-xs text-muted-foreground">
                          {payment.unit}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {payment.unit}
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-semibold text-success">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                        {payment.date}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                          {payment.method}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border">
            <Link
              to="/payments"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View all payments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Overdue Tenants */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-orange-50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Overdue Tenants</h2>
                <p className="text-sm text-muted-foreground mt-1">Accounts requiring attention</p>
              </div>
              {overdueTenants.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendingBulk}
                  onClick={async () => {
                    if (!confirm('Send reminders to all overdue tenants?')) return;
                    setSendingBulk(true);
                    try {
                      const res = await api.bulkSendReminders();
                      if (res.data) {
                        toast.success(res.data.message);
                        await loadDashboardData();
                      } else {
                        toast.error('Failed to send reminders');
                      }
                    } catch {
                      toast.error('Failed to send reminders');
                    } finally {
                      setSendingBulk(false);
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                  {sendingBulk ? 'Sending...' : 'Send All Reminders'}
                </Button>
              )}
            </div>
          </div>
          <div className="p-6">
            {overdueTenants.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-white text-xl">✓</span>
                </div>
                <p className="text-sm font-medium text-foreground">All tenants are current</p>
                <p className="text-xs text-muted-foreground mt-1">No overdue accounts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.unit}</p>
                      </div>
                      <StatusBadge variant="overdue">{tenant.daysOverdue} days late</StatusBadge>
                    </div>
                    {(tenant.reminderCount > 0 || tenant.lastReminderDate) && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground">
                          {tenant.reminderCount} reminder{tenant.reminderCount !== 1 ? 's' : ''} sent
                          {tenant.lastReminderDate && ` · Last: ${tenant.lastReminderDate}`}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(tenant.amount)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Send reminder to ${tenant.name}?`)) return;

                          try {
                            const res = await api.sendReminder(tenant.id);
                            if (res.data?.success) {
                              toast.success(res.data.message || 'Reminder sent!');
                            } else {
                              toast.error(res.data?.message || 'Failed to send reminder');
                            }
                            await loadDashboardData();
                          } catch {
                            toast.error('Failed to send reminder');
                          }
                        }}
                      >
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {overdueTenants.length > 0 && (
            <div className="px-5 py-3 border-t border-border">
              <Link
                to="/tenants?status=overdue"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
