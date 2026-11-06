import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getTenants } from "@/services/tenants";
import type { TenantWithDetails } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search } from "lucide-react";
import { TenantsSkeleton } from "@/components/skeletons/TenantsSkeleton";
import { AddTenantModal } from "@/components/AddTenantModal";
import { Pagination, paginate } from '@/components/Pagination';
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type TenantStatus = "all" | "paid" | "pending" | "overdue";

const statusWords: Record<TenantWithDetails["payment_status"], string> = {
  paid: "Paid",
  pending: "Due",
  overdue: "Late",
};

function TenantRow({ tenant }: { tenant: TenantWithDetails }) {
  const name = `${tenant.first_name} ${tenant.last_name}`.trim();
  const archived = !tenant.unit_name;
  const late = !archived && tenant.payment_status === "overdue";
  const place = [tenant.unit_name, tenant.property_name].filter(Boolean).join(", ");

  return (
    <li className="grid grid-cols-[1fr_auto] items-start gap-x-4 border-t border-rule py-3 sm:grid-cols-[minmax(0,1fr)_120px_170px] sm:items-center">
      <div className="min-w-0">
        <Link
          to={`/tenants/${tenant.id}`}
          className={cn("block truncate text-base hover:underline", late ? "font-semibold" : "font-medium", archived ? "text-quiet" : "text-ink")}
        >
          {name}
        </Link>
        <p className="truncate text-[13.5px] text-quiet">{archived ? "Archived, no unit" : place}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-right sm:contents">
        <p className="sm:order-3 sm:text-right">
          {archived ? (
            <span className="text-[13.5px] text-quiet">No rent</span>
          ) : (
            <>
              <span className="num text-base font-semibold">{formatMoney(tenant.rent_amount)}</span>
              <span className="text-[13.5px] text-quiet"> a month</span>
            </>
          )}
        </p>
        <StatusBadge variant={archived ? "default" : tenant.payment_status} className="sm:order-2">
          {archived ? "Archived" : statusWords[tenant.payment_status]}
        </StatusBadge>
      </div>
    </li>
  );
}

export default function Tenants() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TenantStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
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

  const filteredTenants = tenants.filter((tenant) => {
    const matchesStatus = activeTab === "all" || tenant.payment_status === activeTab;
    const name = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      tenant.unit_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedTenants = paginate(filteredTenants, currentPage, PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab]);

  const housed = tenants.filter(t => t.unit_name);
  const archivedCount = tenants.length - housed.length;
  const lateCount = housed.filter(t => t.payment_status === "overdue").length;
  const monthlyRent = housed.reduce((sum, t) => sum + (t.rent_amount || 0), 0);

  const counts = {
    all: tenants.length,
    paid: tenants.filter((t) => t.payment_status === "paid").length,
    pending: tenants.filter((t) => t.payment_status === "pending").length,
    overdue: tenants.filter((t) => t.payment_status === "overdue").length,
  };

  const tabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "overdue" as const, label: "Late", count: counts.overdue },
    { value: "pending" as const, label: "Due", count: counts.pending },
    { value: "paid" as const, label: "Paid", count: counts.paid },
  ];

  if (loading) return <TenantsSkeleton />;

  const emptyMessage = searchQuery
    ? `No tenants match "${searchQuery}"`
    : activeTab !== "all"
    ? `No ${statusWords[activeTab].toLowerCase()} tenants`
    : "No tenants yet";

  return (
    <>
      <PageHeader
        title="Tenants"
        count={tenants.length}
        action={
          tenants.length > 0 ? (
            <Button type="button" onClick={() => setShowAddModal(true)} className="max-sm:h-12 max-sm:w-full">
              Add tenant
            </Button>
          ) : undefined
        }
      />

      {tenants.length > 0 && (
        <p className="mb-6 text-[15px]">
          <b className="num font-semibold">{formatMoney(monthlyRent)}</b> a month in rent from {housed.length} {housed.length === 1 ? "tenant" : "tenants"}.
          {lateCount > 0 ? (
            <> <b className="font-semibold text-late">{lateCount} {lateCount === 1 ? "is" : "are"} late.</b></>
          ) : housed.length > 0 ? (
            <> Nobody is late.</>
          ) : null}
          {archivedCount > 0 && <span className="text-quiet"> {archivedCount} archived without a unit.</span>}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterTabs<TenantStatus> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="relative w-full sm:w-64">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
          <Input
            aria-label="Search tenants"
            placeholder="Search by name or unit"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <EmptyState
          message={emptyMessage}
          description={
            !searchQuery && activeTab === "all"
              ? "Each tenant you add shows here with their unit, rent and whether they have paid."
              : undefined
          }
          action={
            !searchQuery && activeTab === "all" ? (
              <Button type="button" onClick={() => setShowAddModal(true)}>Add tenant</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul>
            {paginatedTenants.map((tenant) => <TenantRow key={tenant.id} tenant={tenant} />)}
          </ul>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTenants.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

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
