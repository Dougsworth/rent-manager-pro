import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getInvoices } from "@/services/invoices";
import { getPayments } from "@/services/payments";
import { getTenants } from "@/services/tenants";
import type { InvoiceWithTenant, PaymentWithDetails, TenantWithDetails } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarSkeleton } from "@/components/skeletons/CalendarSkeleton";

interface CalendarEvent {
  type: "invoice_due" | "payment" | "lease_start" | "lease_end";
  label: string;
  detail: string;
}

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  invoice_due: "bg-blue-500",
  payment: "bg-emerald-500",
  lease_start: "bg-amber-500",
  lease_end: "bg-red-500",
};

const EVENT_LABELS: Record<CalendarEvent["type"], string> = {
  invoice_due: "Invoice Due",
  payment: "Payment",
  lease_start: "Lease Start",
  lease_end: "Lease End",
};

const EVENT_ICONS: Record<CalendarEvent["type"], React.ReactNode> = {
  invoice_due: <FileText className="h-4 w-4 text-blue-500" />,
  payment: <CreditCard className="h-4 w-4 text-emerald-500" />,
  lease_start: <UserPlus className="h-4 w-4 text-amber-500" />,
  lease_end: <UserMinus className="h-4 w-4 text-red-500" />,
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function toDateKey(dateStr: string): string {
  // Handles both 'YYYY-MM-DD' and ISO datetime strings
  return dateStr.slice(0, 10);
}

function isSameMonth(year: number, month: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month;
}

export default function Calendar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [inv, pay, ten] = await Promise.all([
          getInvoices(user.id),
          getPayments(user.id),
          getTenants(user.id),
        ]);
        setInvoices(inv);
        setPayments(pay);
        setTenants(ten);
      } catch (err) {
        console.error("Failed to load calendar data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Build event map
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const addEvent = (dateKey: string, event: CalendarEvent) => {
      const existing = map.get(dateKey) || [];
      existing.push(event);
      map.set(dateKey, existing);
    };

    for (const inv of invoices) {
      addEvent(toDateKey(inv.due_date), {
        type: "invoice_due",
        label: `${inv.invoice_number} due`,
        detail: `${inv.tenant_first_name} ${inv.tenant_last_name} — J$${inv.amount.toLocaleString()}`,
      });
    }

    for (const pay of payments) {
      addEvent(toDateKey(pay.payment_date), {
        type: "payment",
        label: `${pay.payment_number}`,
        detail: `${pay.tenant_first_name} ${pay.tenant_last_name} paid J$${pay.amount.toLocaleString()}`,
      });
    }

    for (const t of tenants) {
      if (t.lease_start) {
        addEvent(toDateKey(t.lease_start), {
          type: "lease_start",
          label: "Lease starts",
          detail: `${t.first_name} ${t.last_name}`,
        });
      }
      if (t.lease_end) {
        addEvent(toDateKey(t.lease_end), {
          type: "lease_end",
          label: "Lease ends",
          detail: `${t.first_name} ${t.last_name}`,
        });
      }
    }

    return map;
  }, [invoices, payments, tenants]);

  // Stats for visible month
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    let invoicesDue = 0, paymentsMade = 0, leasesStarting = 0, leasesEnding = 0;

    for (const inv of invoices) {
      if (toDateKey(inv.due_date).startsWith(prefix)) invoicesDue++;
    }
    for (const pay of payments) {
      if (toDateKey(pay.payment_date).startsWith(prefix)) paymentsMade++;
    }
    for (const t of tenants) {
      if (t.lease_start && toDateKey(t.lease_start).startsWith(prefix)) leasesStarting++;
      if (t.lease_end && toDateKey(t.lease_end).startsWith(prefix)) leasesEnding++;
    }

    return { invoicesDue, paymentsMade, leasesStarting, leasesEnding };
  }, [invoices, payments, tenants, viewYear, viewMonth]);

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedDayEvents = selectedDay ? eventMap.get(selectedDay) || [] : [];

  if (loading) return <CalendarSkeleton />;

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Visual overview of invoices, payments, and lease milestones"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Invoices Due", value: monthStats.invoicesDue, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Payments Made", value: monthStats.paymentsMade, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Leases Starting", value: monthStats.leasesStarting, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Leases Ending", value: monthStats.leasesEnding, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-slate-200/60 bg-white px-4 py-3`}>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
            {formatMonthYear(viewYear, viewMonth)}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!isSameMonth(viewYear, viewMonth) && (
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-500">
        {(["invoice_due", "payment", "lease_start", "lease_end"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[type]}`} />
            {EVENT_LABELS[type]}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-50 bg-slate-25" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const events = eventMap.get(dateKey) || [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDay;

              // Deduplicate event types for dot display
              const eventTypes = [...new Set(events.map((e) => e.type))];

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDay(events.length > 0 ? dateKey : null)}
                  className={`min-h-[80px] border-b border-r border-slate-50 p-1.5 transition-colors duration-150 ${
                    events.length > 0 ? "cursor-pointer hover:bg-slate-50" : ""
                  } ${isSelected ? "bg-slate-100 ring-1 ring-inset ring-slate-300" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                        isToday
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {events.length}
                      </span>
                    )}
                  </div>
                  {eventTypes.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {eventTypes.map((type) => (
                        <span
                          key={type}
                          className={`w-2 h-2 rounded-full ${EVENT_COLORS[type]}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        {selectedDay && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-400">No events this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {EVENT_ICONS[event.type]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{event.label}</p>
                        <p className="text-xs text-slate-500">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Day Detail — shown below calendar on small screens */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="lg:hidden mt-4 bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <div className="space-y-3">
            {selectedDayEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {EVENT_ICONS[event.type]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{event.label}</p>
                  <p className="text-xs text-slate-500">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
