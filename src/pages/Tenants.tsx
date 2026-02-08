import { useState, useEffect } from "react";
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
import { api } from "@/services/api";
import { useSearchParams } from "react-router-dom";

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


function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Tenants() {
  const [searchParams] = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // Safe setter that ensures we always set an array
  const setSafeTenantsState = (data: any) => {
    if (Array.isArray(data)) {
      setTenants(data);
    } else {
      console.warn('Attempted to set non-array as tenants:', data);
      setTenants([]);
    }
  };
  
  // Get initial tab from URL params
  const initialTab = (searchParams.get('status') as TenantStatus) || "all";
  const [activeTab, setActiveTab] = useState<TenantStatus>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Ensure tenants is always an array
  const safeTenantsArray = Array.isArray(tenants) ? tenants : [];

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const response = await api.getTenants();
      if (response.data) {
        setSafeTenantsState(response.data);
      } else if (response.error) {
        console.error('API Error:', response.error);
        setSafeTenantsState([]);
      } else {
        console.warn('No data or error in response:', response);
        setSafeTenantsState([]);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setSafeTenantsState([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = safeTenantsArray.filter((tenant) => {
    const matchesStatus = activeTab === "all" || tenant.status === activeTab;
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: safeTenantsArray.length,
    paid: safeTenantsArray.filter((t) => t.status === "paid").length,
    pending: safeTenantsArray.filter((t) => t.status === "pending").length,
    overdue: safeTenantsArray.filter((t) => t.status === "overdue").length,
  };

  const tabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "paid" as const, label: "Paid", count: counts.paid },
    { value: "pending" as const, label: "Pending", count: counts.pending },
    { value: "overdue" as const, label: "Overdue", count: counts.overdue },
  ];

  const handleAddTenant = async (tenantData: Omit<Tenant, 'id' | 'status'>) => {
    try {
      const response = await api.createTenant(tenantData);
      if (response.data) {
        await loadTenants();
        setShowAddModal(false);
      } else if (response.error) {
        // Parse error message for user-friendly display
        let errorMessage = 'Failed to create tenant';
        try {
          const errorData = JSON.parse(response.error);
          if (errorData.details?.email) {
            errorMessage = 'A tenant with this email address already exists. Please use a different email.';
          } else if (errorData.details?.phone) {
            errorMessage = 'Phone number format: +1 876 XXX XXXX or leave blank';
          } else if (errorData.details?.unit) {
            errorMessage = 'This unit is already occupied. Please choose a different unit.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage = response.error;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('Failed to create tenant. Please try again.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Tenants" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Tenants"
        count={safeTenantsArray.length}
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
          action={undefined}
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
        {selectedTenant && (
          <TenantDetail 
            tenant={selectedTenant} 
            onTenantUpdate={loadTenants}
            onClose={() => setSelectedTenant(null)}
          />
        )}
      </SlideOutPanel>

      {/* Add Tenant Modal */}
      <AddTenantModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddTenant}
      />
    </AppLayout>
  );
}
