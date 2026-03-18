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
import {
  Bell,
  CheckCheck,
  Trash2,
  DollarSign,
  FileText,
  UserPlus,
  AlertTriangle,
  ImageIcon,
  Clock,
  Info,
  X,
} from "lucide-react";
import { NotificationsSkeleton } from "@/components/skeletons/NotificationsSkeleton";

type StatusFilter = "all" | "unread" | "read";

const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "payment_received", label: "Payment Received" },
  { value: "payment_overdue", label: "Payment Overdue" },
  { value: "invoice_created", label: "Invoice Created" },
  { value: "proof_submitted", label: "Proof Submitted" },
  { value: "proof_approved", label: "Proof Approved" },
  { value: "proof_rejected", label: "Proof Rejected" },
  { value: "tenant_added", label: "Tenant Added" },
  { value: "lease_expiring", label: "Lease Expiring" },
  { value: "late_fee_applied", label: "Late Fee Applied" },
  { value: "system", label: "System" },
];

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "payment_received":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "payment_overdue":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "invoice_created":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "proof_submitted":
      return <ImageIcon className="h-4 w-4 text-amber-500" />;
    case "proof_approved":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "proof_rejected":
      return <X className="h-4 w-4 text-red-500" />;
    case "tenant_added":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "lease_expiring":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "late_fee_applied":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "system":
      return <Info className="h-4 w-4 text-slate-500" />;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case "payment_received":
    case "proof_approved":
      return "bg-emerald-50";
    case "payment_overdue":
    case "proof_rejected":
      return "bg-red-50";
    case "invoice_created":
    case "tenant_added":
      return "bg-blue-50";
    case "proof_submitted":
    case "lease_expiring":
      return "bg-amber-50";
    case "late_fee_applied":
      return "bg-orange-50";
    case "system":
      return "bg-slate-50";
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

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const filters: { isRead?: boolean; type?: NotificationType } = {};
      if (statusFilter === "unread") filters.isRead = false;
      if (statusFilter === "read") filters.isRead = true;
      if (typeFilter !== "all") filters.type = typeFilter;

      const data = await getNotifications(user.id, filters);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
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
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    try {
      await clearAllNotifications(user.id);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const paginatedNotifications = paginate(notifications, currentPage, PAGE_SIZE);

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
        description="Stay updated on payments, invoices, and tenant activity"
        count={notifications.length}
        action={
          notifications.length > 0 ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <FilterTabs<StatusFilter>
          tabs={statusTabs}
          activeTab={statusFilter}
          onTabChange={setStatusFilter}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {NOTIFICATION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          message={
            statusFilter !== "all" || typeFilter !== "all"
              ? "No matching notifications"
              : "No notifications yet"
          }
          description={
            statusFilter === "all" && typeFilter === "all"
              ? "You'll see notifications here when payments are received, invoices are created, and more."
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-6 py-4 transition-colors duration-150 ${
                !notification.is_read ? "bg-blue-50/30" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${getNotificationColor(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-sm ${
                        !notification.is_read
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {timeAgo(notification.created_at)}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 ml-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalItems={notifications.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
