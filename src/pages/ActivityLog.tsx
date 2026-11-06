import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getActivityLogs } from "@/services/activityLog";
import type { ActivityLog, ActivityLogAction } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Pagination, paginate } from "@/components/Pagination";
import { ActivityLogSkeleton } from "@/components/skeletons/ActivityLogSkeleton";

type EntityFilter = "all" | "invoice" | "payment" | "tenant" | "property" | "unit" | "proof";

const ENTITY_TABS: { value: EntityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "invoice", label: "Invoices" },
  { value: "payment", label: "Payments" },
  { value: "tenant", label: "Tenants" },
  { value: "property", label: "Properties" },
  { value: "unit", label: "Units" },
  { value: "proof", label: "Proofs" },
];

const ACTION_OPTIONS: { value: ActivityLogAction | "all"; label: string }[] = [
  { value: "all", label: "Every action" },
  { value: "invoice_created", label: "Invoice created" },
  { value: "invoice_bulk_created", label: "Invoices created together" },
  { value: "invoice_updated", label: "Invoice changed" },
  { value: "payment_created", label: "Payment recorded" },
  { value: "tenant_added", label: "Tenant added" },
  { value: "tenant_updated", label: "Tenant changed" },
  { value: "tenant_deleted", label: "Tenant removed" },
  { value: "proof_submitted", label: "Proof sent" },
  { value: "proof_approved", label: "Proof approved" },
  { value: "proof_rejected", label: "Proof not accepted" },
  { value: "property_created", label: "Property added" },
  { value: "property_updated", label: "Property changed" },
  { value: "property_deleted", label: "Property removed" },
  { value: "unit_created", label: "Unit added" },
  { value: "unit_updated", label: "Unit changed" },
  { value: "unit_deleted", label: "Unit removed" },
];

const ENTITY_WORD: Record<string, string> = {
  invoice: "Invoice",
  payment: "Payment",
  tenant: "Tenant",
  property: "Property",
  unit: "Unit",
  proof: "Proof of payment",
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return "Today";
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Rows for one page, grouped under the day they happened. */
function groupByDay(logs: ActivityLog[]) {
  const groups: { key: string; label: string; logs: ActivityLog[] }[] = [];
  for (const log of logs) {
    const d = new Date(log.created_at);
    const key = dayKey(d);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.logs.push(log);
    else groups.push({ key, label: dayLabel(d), logs: [log] });
  }
  return groups;
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [actionFilter, setActionFilter] = useState<ActivityLogAction | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadLogs = async () => {
    if (!user) return;
    setError(false);
    try {
      const filters: { action?: ActivityLogAction; entityType?: string } = {};
      if (actionFilter !== "all") filters.action = actionFilter;
      if (entityFilter !== "all") filters.entityType = entityFilter;

      const data = await getActivityLogs(user.id, filters);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user, entityFilter, actionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [entityFilter, actionFilter]);

  const entityCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
    return acc;
  }, {});

  const tabsWithCounts = ENTITY_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "all" ? logs.length : entityCounts[tab.value] || 0,
  }));

  const paginatedLogs = paginate(logs, currentPage, PAGE_SIZE);
  const filtered = entityFilter !== "all" || actionFilter !== "all";

  if (loading) return <ActivityLogSkeleton />;

  return (
    <>
      <PageHeader title="Activity" description="Everything done in your account, newest first." />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <FilterTabs<EntityFilter> tabs={tabsWithCounts} activeTab={entityFilter} onTabChange={setEntityFilter} />
        </div>
        <label className="flex items-center gap-2 text-sm text-quiet">
          Show
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActivityLogAction | "all")}
            className="h-10 min-w-0 flex-1 cursor-pointer rounded-[3px] border border-input bg-transparent px-3 text-sm text-ink hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid lg:flex-none"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="pt-4">
          <h2 className="text-lg font-semibold">We could not load your activity</h2>
          <p className="mt-1 text-[15px] text-quiet">Check your connection and try again.</p>
          <Button className="mt-4" onClick={() => { setLoading(true); loadLogs(); }}>Try again</Button>
        </div>
      ) : logs.length === 0 ? (
        <div className="[&>div]:border-t-0 [&>div]:pt-4">
        <EmptyState
          message={filtered ? "Nothing matches these filters" : "Nothing here yet"}
          description={
            filtered
              ? "Try another filter, or show everything."
              : "When you add tenants, create invoices or record payments, each one is listed here with the time it happened."
          }
          action={
            filtered ? (
              <Button variant="outline" onClick={() => { setEntityFilter("all"); setActionFilter("all"); }}>Show everything</Button>
            ) : undefined
          }
        />
        </div>
      ) : (
        <>
          {groupByDay(paginatedLogs).map((group) => (
            <section key={group.key} className="mb-7">
              <h2 className="pb-2 text-[15px] font-semibold">{group.label}</h2>
              <ul>
                {group.logs.map((log) => (
                  <li key={log.id} className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-4 border-t border-rule py-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
                    <time dateTime={log.created_at} className="num text-[13.5px] leading-6 text-quiet">{timeLabel(new Date(log.created_at))}</time>
                    <p className="text-[15px] leading-6 text-ink">{log.description}</p>
                    <span className="col-start-2 text-[13.5px] text-quiet sm:col-start-3 sm:leading-6">{ENTITY_WORD[log.entity_type] ?? log.entity_type}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Pagination currentPage={currentPage} totalItems={logs.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}
    </>
  );
}
