import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTenants, deleteTenant } from "@/services/tenants";
import { supabase } from "@/lib/supabase";
import { sendReminder } from "@/services/reminders";
import type { TenantWithDetails } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarInitial } from "@/components/ui/avatar-initial";
import { StatCard } from "@/components/ui/stat-card";
import { Search, Plus, Trash2, Users, X } from "lucide-react";
import { TenantsSkeleton } from "@/components/skeletons/TenantsSkeleton";
import { useToast } from "@/components/ui/toast";
import { AddTenantModal } from "@/components/AddTenantModal";
import { TenantDetail } from "@/components/TenantDetail";
import { Pagination, paginate } from '@/components/Pagination';
import { cn } from "@/lib/utils";

export type TenantStatus = "all" | "paid" | "pending" | "overdue";

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Tenants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TenantStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadTenants = async () => {
    if (!user) return;
    try {
      const data = await getTenants(user.id);
      setTenants(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [user]);

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to remove this tenant?')) return;
    try {
      await deleteTenant(tenantId);
      setSelectedTenant(null);
      await loadTenants();
    } catch (err) {
      console.error('Failed to delete tenant:', err);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedTenant) return;
    setSendingReminder(true);
    try {
      const { data: overdueInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('tenant_id', selectedTenant.id)
        .eq('status', 'overdue')
        .order('due_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!overdueInvoice) {
        const { data: pendingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('tenant_id', selectedTenant.id)
          .eq('status', 'pending')
          .order('due_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!pendingInvoice) {
          toast('No overdue or pending invoices found for this tenant.', 'warning');
          return;
        }
        await sendReminder(selectedTenant.id, pendingInvoice.id);
      } else {
        await sendReminder(selectedTenant.id, overdueInvoice.id);
      }
      toast('Reminder sent successfully!', 'success');
    } catch (err) {
      console.error('Failed to send reminder:', err);
      toast('Failed to send reminder. Please try again.', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesStatus = activeTab === "all" || tenant.payment_status === activeTab;
    const name = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      tenant.unit_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedTenants = paginate(filteredTenants, currentPage, PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab]);

  const assignedTenants = tenants.filter(t => t.unit_name);
  const unassignedCount = tenants.length - assignedTenants.length;

  const counts = {
    all: tenants.length,
    paid: tenants.filter((t) => t.payment_status === "paid").length,
    pending: tenants.filter((t) => t.payment_status === "pending").length,
    overdue: tenants.filter((t) => t.payment_status === "overdue").length,
  };

  const tabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "paid" as const, label: "Paid", count: counts.paid },
    { value: "pending" as const, label: "Pending", count: counts.pending },
    { value: "overdue" as const, label: "Overdue", count: counts.overdue },
  ];

  if (loading) return <TenantsSkeleton />;

  const tenantForDetail = selectedTenant ? {
    id: selectedTenant.id,
    name: `${selectedTenant.first_name} ${selectedTenant.last_name}`,
    email: selectedTenant.email,
    phone: selectedTenant.phone,
    unit: selectedTenant.unit_name,
    rent: selectedTenant.rent_amount,
    status: selectedTenant.payment_status,
    leaseStart: selectedTenant.lease_start ?? '',
    leaseEnd: selectedTenant.lease_end ?? '',
  } : null;

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage your tenants and track payments"
        count={tenants.length}
        action={
          <Button type="button" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tenants"
          value={String(counts.all)}
          subtext={unassignedCount > 0 ? `${unassignedCount} archived` : "Active tenants"}
          subtextColor={unassignedCount > 0 ? "text-slate-400" : undefined}
        />
        <StatCard
          label="Paid"
          value={String(counts.paid)}
          valueColor="text-emerald-600"
          subtext={counts.all > 0 ? `${Math.round((counts.paid / counts.all) * 100)}% of tenants` : "No tenants"}
          subtextColor="text-emerald-500"
        />
        <StatCard
          label="Pending"
          value={String(counts.pending)}
          valueColor="text-amber-600"
          subtext={counts.pending > 0 ? "Awaiting payment" : "None pending"}
        />
        <StatCard
          label="Overdue"
          value={String(counts.overdue)}
          valueColor={counts.overdue > 0 ? "text-red-500" : "text-slate-900"}
          subtext={counts.overdue > 0 ? "Needs attention" : "All on time"}
          subtextColor={counts.overdue > 0 ? "text-red-400" : "text-slate-500"}
        />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <FilterTabs<TenantStatus> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Split View: Tenant List + Detail Panel */}
      <div className="flex gap-6">
        {/* Tenant List */}
        <div className={cn(
          "transition-all duration-300 min-w-0",
          selectedTenant ? "flex-1" : "w-full"
        )}>
          {filteredTenants.length === 0 ? (
            <EmptyState
              icon={Users}
              message={
                searchQuery
                  ? `No tenants matching "${searchQuery}"`
                  : activeTab !== "all"
                  ? `No ${activeTab} tenants`
                  : "No tenants yet"
              }
              description={
                !searchQuery && activeTab === "all"
                  ? "Add your first tenant to start collecting rent."
                  : undefined
              }
              action={
                !searchQuery && activeTab === "all" ? (
                  <Button type="button" onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tenant
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
              {paginatedTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 transition-colors duration-150 text-left",
                    selectedTenant?.id === tenant.id
                      ? "bg-blue-50/60 border-l-2 border-l-blue-500"
                      : "hover:bg-slate-50"
                  )}
                >
                  <AvatarInitial name={`${tenant.first_name} ${tenant.last_name}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {tenant.first_name} {tenant.last_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tenant.unit_name
                        ? `${tenant.unit_name}${tenant.property_name ? ` · ${tenant.property_name}` : ''}`
                        : <span className="text-slate-400">Archived</span>
                      }
                    </p>
                  </div>
                  {!selectedTenant && (
                    <div className="text-right flex items-center gap-3">
                      {tenant.unit_name ? (
                        <>
                          <p className="text-sm font-medium text-slate-900">{formatCurrency(tenant.rent_amount)}</p>
                          <StatusBadge variant={tenant.payment_status}>{tenant.payment_status}</StatusBadge>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Archived</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
              <Pagination
                currentPage={currentPage}
                totalItems={filteredTenants.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Inline Detail Panel */}
        {selectedTenant && tenantForDetail && (
          <div className="w-[440px] flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200/60 sticky top-8 overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900 truncate">
                  {selectedTenant.first_name} {selectedTenant.last_name}
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedTenant.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
              {/* Panel Content */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-5">
                <TenantDetail
                  tenant={tenantForDetail}
                  tenantId={selectedTenant?.id}
                  landlordId={user?.id}
                  onSendReminder={handleSendReminder}
                  sendingReminder={sendingReminder}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Full-screen detail overlay (only on small screens) */}
      {selectedTenant && tenantForDetail && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              {selectedTenant.first_name} {selectedTenant.last_name}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedTenant.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
              <button
                onClick={() => setSelectedTenant(null)}
                className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <TenantDetail
              tenant={tenantForDetail}
              tenantId={selectedTenant?.id}
              landlordId={user?.id}
              onSendReminder={handleSendReminder}
              sendingReminder={sendingReminder}
            />
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      <AddTenantModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadTenants();
        }}
      />
    </>
  );
}
