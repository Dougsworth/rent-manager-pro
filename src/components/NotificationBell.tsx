import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/services/notifications";
import type { Notification, NotificationType } from "@/types/app.types";
import {
  Bell,
  DollarSign,
  FileText,
  AlertTriangle,
  ImageIcon,
  Info,
  X,
  CheckCheck,
} from "lucide-react";

function getIcon(type: NotificationType) {
  switch (type) {
    case "payment_received":
    case "proof_approved":
      return <DollarSign className="h-3.5 w-3.5 text-emerald-500" />;
    case "payment_overdue":
    case "proof_rejected":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    case "invoice_created":
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    case "tenant_added":
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    case "proof_submitted":
      return <ImageIcon className="h-3.5 w-3.5 text-amber-500" />;
    case "lease_expiring":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    case "late_fee_applied":
      return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
    case "system":
      return <Info className="h-3.5 w-3.5 text-slate-500" />;
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

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => getUnreadCount(user.id).then(setUnreadCount).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Load recent when dropdown opens
  useEffect(() => {
    if (!open || !user) return;
    setLoadingRecent(true);
    getNotifications(user.id)
      .then((data) => setRecent(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, [open, user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      setRecent((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllAsRead(user.id);
      setRecent((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors duration-150"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loadingRecent ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications</p>
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                    !n.is_read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-tight ${
                        !n.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-600"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
