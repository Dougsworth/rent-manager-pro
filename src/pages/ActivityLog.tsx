import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getActivityLogs } from "@/services/activityLog";
import type { ActivityLog, ActivityLogAction } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Pagination, paginate } from "@/components/Pagination";
import {
  ClipboardList,
  Loader2,
  FileText,
  CreditCard,
  UserPlus,
  UserMinus,
  UserCog,
  ImageIcon,
  Home,
  PenSquare,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
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
  { value: "all", label: "All Actions" },
  { value: "invoice_created", label: "Invoice Created" },
  { value: "invoice_bulk_created", label: "Bulk Invoices" },
  { value: "invoice_updated", label: "Invoice Updated" },
  { value: "payment_created", label: "Payment Created" },
  { value: "tenant_added", label: "Tenant Added" },
  { value: "tenant_updated", label: "Tenant Updated" },
  { value: "tenant_deleted", label: "Tenant Deleted" },
  { value: "proof_submitted", label: "Proof Submitted" },
  { value: "proof_approved", label: "Proof Approved" },
  { value: "proof_rejected", label: "Proof Rejected" },
  { value: "property_created", label: "Property Created" },
  { value: "property_updated", label: "Property Updated" },
  { value: "property_deleted", label: "Property Deleted" },
  { value: "unit_created", label: "Unit Created" },
  { value: "unit_updated", label: "Unit Updated" },
  { value: "unit_deleted", label: "Unit Deleted" },
];

function getActionIcon(action: string) {
  switch (action) {
    case "invoice_created":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "invoice_bulk_created":
      return <Layers className="h-4 w-4 text-blue-500" />;
    case "invoice_updated":
      return <PenSquare className="h-4 w-4 text-blue-500" />;
    case "payment_created":
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    case "tenant_added":
      return <UserPlus className="h-4 w-4 text-indigo-500" />;
    case "tenant_updated":
      return <UserCog className="h-4 w-4 text-indigo-500" />;
    case "tenant_deleted":
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case "proof_submitted":
      return <ImageIcon className="h-4 w-4 text-amber-500" />;
    case "proof_approved":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "proof_rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "property_created":
      return <Plus className="h-4 w-4 text-violet-500" />;
    case "property_updated":
      return <PenSquare className="h-4 w-4 text-violet-500" />;
    case "property_deleted":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case "unit_created":
      return <Plus className="h-4 w-4 text-teal-500" />;
    case "unit_updated":
      return <PenSquare className="h-4 w-4 text-teal-500" />;
    case "unit_deleted":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    default:
      return <Home className="h-4 w-4 text-slate-400" />;
  }
}

function getActionBgColor(action: string) {
  if (action.startsWith("invoice")) return "bg-blue-50";
  if (action.startsWith("payment")) return "bg-emerald-50";
  if (action.startsWith("tenant")) return action.includes("deleted") ? "bg-red-50" : "bg-indigo-50";
  if (action.startsWith("proof")) return action.includes("rejected") ? "bg-red-50" : action.includes("approved") ? "bg-emerald-50" : "bg-amber-50";
  if (action.startsWith("property")) return action.includes("deleted") ? "bg-red-50" : "bg-violet-50";
  if (action.startsWith("unit")) return action.includes("deleted") ? "bg-red-50" : "bg-teal-50";
  return "bg-slate-50";
}

function getEntityBadgeColor(entityType: string) {
  switch (entityType) {
    case "invoice": return "bg-blue-100 text-blue-700";
    case "payment": return "bg-emerald-100 text-emerald-700";
    case "tenant": return "bg-indigo-100 text-indigo-700";
    case "property": return "bg-violet-100 text-violet-700";
    case "unit": return "bg-teal-100 text-teal-700";
    case "proof": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [actionFilter, setActionFilter] = useState<ActivityLogAction | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadLogs = async () => {
    if (!user) return;
    try {
      const filters: { action?: ActivityLogAction; entityType?: string } = {};
      if (actionFilter !== "all") filters.action = actionFilter;
      if (entityFilter !== "all") filters.entityType = entityFilter;

      const data = await getActivityLogs(user.id, filters);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
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

  if (loading) return <ActivityLogSkeleton />;

  return (
    <>
      <PageHeader
        title="Activity Log"
        description="Audit trail of all actions — who did what and when"
        count={logs.length}
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <FilterTabs<EntityFilter>
          tabs={tabsWithCounts}
          activeTab={entityFilter}
          onTabChange={setEntityFilter}
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as ActivityLogAction | "all")}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Log List */}
      {logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          message={
            entityFilter !== "all" || actionFilter !== "all"
              ? "No matching activity"
              : "No activity yet"
          }
          description={
            entityFilter === "all" && actionFilter === "all"
              ? "Actions like creating invoices, adding tenants, and recording payments will appear here."
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
          {paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 px-6 py-4"
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${getActionBgColor(log.action)}`}
              >
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEntityBadgeColor(log.entity_type)}`}>
                        {log.entity_type}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalItems={logs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
