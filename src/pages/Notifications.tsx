import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/services/notifications";
import type { Notification, NotificationType } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Pagination, paginate } from "@/components/Pagination";
import { NotificationsSkeleton } from "@/components/skeletons/NotificationsSkeleton";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "unread" | "read";

const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "Every kind" },
  { value: "payment_received", label: "Payment received" },
  { value: "payment_overdue", label: "Payment late" },
  { value: "invoice_created", label: "Invoice created" },
  { value: "proof_submitted", label: "Proof sent" },
  { value: "proof_approved", label: "Proof approved" },
  { value: "proof_rejected", label: "Proof not accepted" },
  { value: "tenant_added", label: "Tenant added" },
  { value: "lease_expiring", label: "Lease ending" },
  { value: "late_fee_applied", label: "Late fee added" },
  { value: "system", label: "From EasyCollect" },
];

function whenLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadNotifications = async () => {
    if (!user) return;
    setError(false);
    try {
      const filters: { isRead?: boolean; type?: NotificationType } = {};
      if (statusFilter === "unread") filters.isRead = false;
      if (statusFilter === "read") filters.isRead = true;
      if (typeFilter !== "all") filters.type = typeFilter;

      const data = await getNotifications(user.id, filters);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, statusFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm("Remove every notification? You cannot get them back.")) return;
    try {
      await clearAllNotifications(user.id);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const paginatedNotifications = paginate(notifications, currentPage, PAGE_SIZE);
  const filtered = statusFilter !== "all" || typeFilter !== "all";

  const statusTabs = [
    { value: "all" as const, label: "All", count: notifications.length },
    { value: "unread" as const, label: "Unread", count: unreadCount },
    { value: "read" as const, label: "Read", count: notifications.length - unreadCount },
  ];

  if (loading) return <NotificationsSkeleton />;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Payments, proofs, late rent and other things worth knowing."
        action={
          notifications.length > 0 ? (
            <>
              {unreadCount > 0 && <Button variant="outline" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
              <Button variant="ghost" size="sm" onClick={handleClearAll}>Clear all</Button>
            </>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <FilterTabs<StatusFilter> tabs={statusTabs} activeTab={statusFilter} onTabChange={setStatusFilter} />
        </div>
        <label className="flex items-center gap-2 text-sm text-quiet">
          Show
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
            className="h-10 min-w-0 flex-1 cursor-pointer rounded-[3px] border border-input bg-transparent px-3 text-sm text-ink hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid sm:flex-none"
          >
            {NOTIFICATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="pt-4">
          <h2 className="text-lg font-semibold">We could not load your notifications</h2>
          <p className="mt-1 text-[15px] text-quiet">Check your connection and try again.</p>
          <Button className="mt-4" onClick={() => { setLoading(true); loadNotifications(); }}>Try again</Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="[&>div]:border-t-0 [&>div]:pt-4">
        <EmptyState
          message={filtered ? "Nothing matches these filters" : "No notifications yet"}
          description={
            filtered
              ? "Try another filter, or show everything."
              : "You will see a note here when a tenant pays, sends proof of payment, or goes late."
          }
          action={
            filtered ? (
              <Button variant="outline" onClick={() => { setStatusFilter("all"); setTypeFilter("all"); }}>Show everything</Button>
            ) : undefined
          }
        />
        </div>
      ) : (
        <>
          <ul className="border-b border-rule [&>li:first-child]:border-t-0">
            {paginatedNotifications.map((n) => (
              <li key={n.id} className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-rule py-3.5 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
                <time dateTime={n.created_at} className="num text-[13.5px] leading-6 text-quiet">{whenLabel(n.created_at)}</time>
                <div className="min-w-0">
                  <p className={cn("text-[15px] leading-6", n.is_read ? "font-medium text-ink" : "font-semibold text-ink")}>
                    {!n.is_read && <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 bg-ink align-middle" />}
                    {!n.is_read && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </p>
                  <p className="text-[15px] text-quiet">{n.message}</p>
                </div>
                <div className="flex gap-4 text-sm sm:justify-end">
                  {!n.is_read && (
                    <button onClick={() => handleMarkAsRead(n.id)} className="min-h-11 cursor-pointer font-medium text-shell underline sm:min-h-6">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="min-h-11 cursor-pointer text-quiet underline hover:text-late sm:min-h-6">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination currentPage={currentPage} totalItems={notifications.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}
    </>
  );
}
