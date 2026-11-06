import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/services/notifications";
import type { Notification } from "@/types/app.types";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 340;

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

/**
 * The bell takes its colour from where it sits: white on the green phone
 * header, ink on the light desktop bar. The unread count is a plain number.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => getUnreadCount(user.id).then(setUnreadCount).catch((err) => console.error('NotificationBell: failed to fetch unread count', err));
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Load recent when dropdown opens
  useEffect(() => {
    if (!open || !user) return;
    setLoadingRecent(true);
    setLoadError(false);
    getNotifications(user.id)
      .then((data) => setRecent(data.slice(0, 8)))
      .catch((err) => {
        console.error('NotificationBell: failed to fetch notifications', err);
        setLoadError(true);
      })
      .finally(() => setLoadingRecent(false));
  }, [open, user]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !dropdownRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
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

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
      setDropdownPos({
        top: rect.bottom + 6,
        left: Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8),
      });
    }
    setOpen(!open);
  };

  const countLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-[3px] px-2 text-ink transition-colors duration-100 lg:h-10 lg:hover:bg-secondary"
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && <span aria-hidden="true" className="num text-sm font-semibold">{countLabel}</span>}
      </button>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          role="dialog"
          aria-label="Recent notifications"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: Math.min(PANEL_WIDTH, window.innerWidth - 16) }}
          className="fixed z-50 border border-rule bg-popover text-ink shadow-lg"
        >
          <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3">
            <h2 className="text-[15px] font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="min-h-8 cursor-pointer text-sm font-medium text-shell underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(360px,60vh)] overflow-y-auto overscroll-contain">
            {loadingRecent ? (
              <p className="border-t border-rule px-4 py-6 text-sm text-quiet">Loading</p>
            ) : loadError ? (
              <p className="border-t border-rule px-4 py-6 text-sm text-quiet">Could not load notifications. Check your connection.</p>
            ) : recent.length === 0 ? (
              <p className="border-t border-rule px-4 py-6 text-sm text-quiet">Nothing new. You will see payments, proofs and late rent here.</p>
            ) : (
              <ul>
                {recent.map((n) => (
                  <li key={n.id} className="border-t border-rule">
                    <button
                      type="button"
                      onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                      className="block w-full cursor-pointer px-4 py-2.5 text-left transition-colors duration-100 hover:bg-secondary"
                    >
                      <span className={cn("block text-sm", n.is_read ? "font-medium" : "font-semibold")}>
                        {!n.is_read && <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-ink align-middle" />}
                        {!n.is_read && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </span>
                      <span className="block text-[13.5px] text-quiet">{n.message}</span>
                      <span className="mt-0.5 block text-[13px] text-quiet">{whenLabel(n.created_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-rule px-4 py-2">
            <Link to="/notifications" onClick={() => setOpen(false)} className="inline-flex min-h-8 items-center text-sm font-semibold text-shell underline">
              See all notifications
            </Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
