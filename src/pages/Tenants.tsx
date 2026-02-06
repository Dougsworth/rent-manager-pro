import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { SlideOutPanel } from "@/components/SlideOutPanel";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarInitial } from "@/components/ui/avatar-initial";
import { Search, Plus } from "lucide-react";
import { AddTenantModal } from "@/components/AddTenantModal";
import { TenantDetail } from "@/components/TenantDetail";

export type TenantStatus = "all" | "paid" | "pending" | "overdue";

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  unit: string;
  rent: number;
  status: "paid" | "pending" | "overdue";
  leaseStart: string;
  leaseEnd: string;
}

// Mock data
const mockTenants: Tenant[] = [
  { id: 1, name: "Marcus Brown", email: "marcus@email.com", phone: "876-555-0101", unit: "Unit 1A", rent: 45000, status: "paid", leaseStart: "2025-01-01", leaseEnd: "2026-01-01" },
  { id: 2, name: "Angela Chen", email: "angela@email.com", phone: "876-555-0102", unit: "Unit 2B", rent: 42000, status: "paid", leaseStart: "2025-03-01", leaseEnd: "2026-03-01" },
  { id: 3, name: "David Williams", email: "david@email.com", phone: "876-555-0103", unit: "Unit 3C", rent: 48000, status: "pending", leaseStart: "2025-02-01", leaseEnd: "2026-02-01" },
  { id: 4, name: "Sarah Thompson", email: "sarah@email.com", phone: "876-555-0104", unit: "Unit 4D", rent: 48000, status: "overdue", leaseStart: "2024-12-01", leaseEnd: "2025-12-01" },
  { id: 5, name: "Michael Lee", email: "michael@email.com", phone: "876-555-0105", unit: "Unit 5E", rent: 42000, status: "pending", leaseStart: "2025-04-01", leaseEnd: "2026-04-01" },
];

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Tenants() {
  const [activeTab, setActiveTab] = useState<TenantStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTenants = mockTenants.filter((tenant) => {
    const matchesStatus = activeTab === "all" || tenant.status === activeTab;
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: mockTenants.length,
    paid: mockTenants.filter((t) => t.status === "paid").length,
    pending: mockTenants.filter((t) => t.status === "pending").length,
    overdue: mockTenants.filter((t) => t.status === "overdue").length,
  };

  const tabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "paid" as const, label: "Paid", count: counts.paid },
    { value: "pending" as const, label: "Pending", count: counts.pending },
    { value: "overdue" as const, label: "Overdue", count: counts.overdue },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Tenants"
        count={mockTenants.length}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <FilterTabs<TenantStatus> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tenant List */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          message={
            searchQuery
              ? `No tenants matching "${searchQuery}"`
              : activeTab !== "all"
              ? `No ${activeTab} tenants`
              : "No tenants yet. Add your first tenant to start collecting rent."
          }
          action={
            !searchQuery && activeTab === "all" ? (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                Add Tenant
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {filteredTenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => setSelectedTenant(tenant)}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary transition-colors text-left"
            >
              <AvatarInitial name={tenant.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">{tenant.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(tenant.rent)}</p>
                <StatusBadge variant={tenant.status}>{tenant.status}</StatusBadge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tenant Detail Panel */}
      <SlideOutPanel
        open={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.name || ""}
        actions={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      >
        {selectedTenant && <TenantDetail tenant={selectedTenant} />}
      </SlideOutPanel>

      {/* Add Tenant Modal */}
      <AddTenantModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </AppLayout>
  );
}
