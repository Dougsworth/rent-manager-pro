import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getInvoices } from "@/services/invoices";
import { getPayments } from "@/services/payments";
import { getTenants } from "@/services/tenants";
import type { InvoiceWithTenant, PaymentWithDetails, TenantWithDetails } from "@/types/app.types";
import { PageHeader } from "@/components/PageHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarSkeleton } from "@/components/skeletons/CalendarSkeleton";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type EventType = "invoice_due" | "payment" | "lease_start" | "lease_end";

/** Marks mean the same as the louvre: paid is solid, late is hatched, due is outlined. */
type Mark = "paid" | "late" | "due" | "lease";

interface CalendarEvent {
  type: EventType;
  mark: Mark;
  name: string;
  tenantId?: string | null;
  what: string;
  amount?: number;
}

const MARKS: Record<Mark, string> = {
  paid: "bg-paid",
  late: "border border-late hatch-late",
  due: "border border-paid",
  lease: "bg-quiet w-[2px]",
};

const MARK_ORDER: Record<Mark, number> = { late: 0, due: 1, paid: 2, lease: 3 };

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

function dayLabel(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }): string {
  return new Date(key + "T12:00:00").toLocaleDateString("en-US", opts);
}

function isSameMonth(year: number, month: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month;
}

function EventMark({ mark, className }: { mark: Mark; className?: string }) {
  return <span aria-hidden="true" className={cn("block h-3 w-1.5 shrink-0", MARKS[mark], className)} />;
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
      const mark: Mark = inv.status === "overdue" ? "late" : inv.status === "paid" ? "paid" : "due";
      addEvent(toDateKey(inv.due_date), {
        type: "invoice_due",
        mark,
        name: `${inv.tenant_first_name} ${inv.tenant_last_name}`,
        tenantId: inv.tenant_id,
        what: mark === "late" ? `${inv.invoice_number} due, not paid` : mark === "paid" ? `${inv.invoice_number} due, paid` : `${inv.invoice_number} due`,
        amount: inv.amount,
      });
    }

    for (const pay of payments) {
      addEvent(toDateKey(pay.payment_date), {
        type: "payment",
        mark: "paid",
        name: `${pay.tenant_first_name} ${pay.tenant_last_name}`,
        tenantId: pay.tenant_id,
        what: `Paid, ${pay.payment_number}`,
        amount: pay.amount,
      });
    }

    for (const t of tenants) {
      if (t.lease_start) {
        addEvent(toDateKey(t.lease_start), { type: "lease_start", mark: "lease", name: `${t.first_name} ${t.last_name}`, tenantId: t.id, what: "Lease starts" });
      }
      if (t.lease_end) {
        addEvent(toDateKey(t.lease_end), { type: "lease_end", mark: "lease", name: `${t.first_name} ${t.last_name}`, tenantId: t.id, what: "Lease ends" });
      }
    }

    for (const list of map.values()) list.sort((a, b) => MARK_ORDER[a.mark] - MARK_ORDER[b.mark]);
    return map;
  }, [invoices, payments, tenants]);

  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  // Counts for the visible month, in one line of words
  const monthStats = useMemo(() => {
    let invoicesDue = 0, paymentsMade = 0, leasesStarting = 0, leasesEnding = 0, late = 0;
    for (const inv of invoices) {
      if (toDateKey(inv.due_date).startsWith(prefix)) {
        invoicesDue++;
        if (inv.status === "overdue") late++;
      }
    }
    for (const pay of payments) {
      if (toDateKey(pay.payment_date).startsWith(prefix)) paymentsMade++;
    }
    for (const t of tenants) {
      if (t.lease_start && toDateKey(t.lease_start).startsWith(prefix)) leasesStarting++;
      if (t.lease_end && toDateKey(t.lease_end).startsWith(prefix)) leasesEnding++;
    }
    return { invoicesDue, paymentsMade, leasesStarting, leasesEnding, late };
  }, [invoices, payments, tenants, prefix]);

  // Every day in the visible month that has something on it, in order
  const monthAgenda = useMemo(
    () => [...eventMap.entries()].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => a.localeCompare(b)),
    [eventMap, prefix]
  );

  const goToPrev = () => {
    setSelectedDay(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNext = () => {
    setSelectedDay(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const goToToday = () => {
    setSelectedDay(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const trailing = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (loading) return <CalendarSkeleton />;

  const agenda: [string, CalendarEvent[]][] = selectedDay ? [[selectedDay, eventMap.get(selectedDay) || []]] : monthAgenda;

  const counts = [
    monthStats.invoicesDue > 0 && `${monthStats.invoicesDue} ${monthStats.invoicesDue === 1 ? "invoice" : "invoices"} due`,
    monthStats.paymentsMade > 0 && `${monthStats.paymentsMade} ${monthStats.paymentsMade === 1 ? "payment" : "payments"} in`,
    monthStats.leasesStarting > 0 && `${monthStats.leasesStarting} ${monthStats.leasesStarting === 1 ? "lease starts" : "leases start"}`,
    monthStats.leasesEnding > 0 && `${monthStats.leasesEnding} ${monthStats.leasesEnding === 1 ? "lease ends" : "leases end"}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader title="Calendar" description="When rent is due, when it came in, and when leases start or end." />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrev} aria-label="Previous month">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Button>
          <h2 className="min-w-[168px] text-center text-xl font-semibold" aria-live="polite">{formatMonthYear(viewYear, viewMonth)}</h2>
          <Button variant="ghost" size="icon" onClick={goToNext} aria-label="Next month">
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        {!isSameMonth(viewYear, viewMonth) && (
          <Button variant="outline" size="sm" onClick={goToToday}>Back to this month</Button>
        )}
      </div>

      <p className="num mb-4 text-[15px]">
        {counts.length > 0 ? `${counts.join(", ")}.` : "Nothing on this month."}
        {monthStats.late > 0 && <b className="ml-2 font-semibold text-late">{monthStats.late} still late.</b>}
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 border-b border-ink text-[13.5px] text-quiet">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="px-1.5 pb-1.5 sm:px-2">
                <span className="sm:hidden">{day[0]}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-rule">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`lead-${i}`} aria-hidden="true" className="min-h-[52px] border-b border-r border-rule sm:min-h-[88px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${prefix}-${String(dayNum).padStart(2, "0")}`;
              const events = eventMap.get(dateKey) || [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDay;
              const shown = events.slice(0, 5);
              const late = events.some((e) => e.mark === "late");

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDay(isSelected || events.length === 0 ? null : dateKey)}
                  aria-pressed={isSelected}
                  aria-label={`${dayLabel(dateKey)}${isToday ? ", today" : ""}. ${events.length === 0 ? "Nothing on." : `${events.length} ${events.length === 1 ? "thing" : "things"} on${late ? ", something late" : ""}.`}`}
                  className={cn(
                    "flex min-h-[52px] flex-col items-start justify-between border-b border-r border-rule p-1 text-left transition-colors duration-100 sm:min-h-[88px] sm:p-1.5",
                    events.length > 0 ? "cursor-pointer hover:bg-secondary" : "cursor-default",
                    isSelected && "bg-secondary outline-2 -outline-offset-2 outline-ink"
                  )}
                >
                  <span
                    className={cn(
                      "num inline-flex h-6 min-w-6 items-center justify-center px-0.5 text-[13.5px] sm:h-7 sm:min-w-7 sm:text-sm",
                      isToday ? "bg-ink font-bold text-white" : late ? "font-semibold text-ink" : "text-ink"
                    )}
                  >
                    {dayNum}
                  </span>
                  {events.length > 0 && (
                    <span aria-hidden="true" className="flex items-end gap-[3px]">
                      {shown.map((e, idx) => <EventMark key={idx} mark={e.mark} />)}
                      {events.length > shown.length && <span className="num text-[11px] leading-none text-quiet">+{events.length - shown.length}</span>}
                    </span>
                  )}
                </button>
              );
            })}

            {Array.from({ length: trailing }).map((_, i) => (
              <div key={`trail-${i}`} aria-hidden="true" className="min-h-[52px] border-b border-r border-rule sm:min-h-[88px]" />
            ))}
          </div>

          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-quiet">
            <span className="inline-flex items-center gap-1.5"><EventMark mark="paid" />Paid</span>
            <span className="inline-flex items-center gap-1.5"><EventMark mark="late" />Due and not paid</span>
            <span className="inline-flex items-center gap-1.5"><EventMark mark="due" />Due</span>
            <span className="inline-flex items-center gap-1.5"><EventMark mark="lease" />Lease starts or ends</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3.5 w-3.5 bg-ink" />Today</span>
          </p>
        </div>

        <section aria-label={selectedDay ? dayLabel(selectedDay) : `Everything in ${formatMonthYear(viewYear, viewMonth)}`} className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">{selectedDay ? dayLabel(selectedDay) : "This month, day by day"}</h2>
            {selectedDay && (
              <button type="button" onClick={() => setSelectedDay(null)} className="min-h-10 cursor-pointer text-sm font-semibold text-shell underline underline-offset-[3px]">
                Whole month
              </button>
            )}
          </div>

          {agenda.length === 0 ? (
            <p className="border-t border-rule py-3 text-[15px] text-quiet">Nothing due, paid or changing this month.</p>
          ) : (
            <ol className="lg:max-h-[620px] lg:overflow-y-auto">
              {agenda.map(([key, events]) => (
                <li key={key} className="border-t border-rule py-2.5">
                  {!selectedDay && (
                    <p className={cn("num mb-1 text-[13.5px]", key === todayKey ? "font-semibold text-ink" : "text-quiet")}>
                      {dayLabel(key, { weekday: "short", month: "short", day: "numeric" })}{key === todayKey && ", today"}
                    </p>
                  )}
                  <ul className="space-y-1.5">
                    {events.map((e, idx) => (
                      <li key={idx} className="grid grid-cols-[6px_minmax(0,1fr)_auto] items-start gap-x-2.5">
                        <EventMark mark={e.mark} className="mt-[5px]" />
                        <span className="min-w-0">
                          {e.tenantId ? (
                            <Link to={`/tenants/${e.tenantId}`} className={cn("block truncate text-[15px] text-ink hover:underline", e.mark === "late" ? "font-semibold" : "font-medium")}>{e.name}</Link>
                          ) : (
                            <span className="block truncate text-[15px] font-medium">{e.name}</span>
                          )}
                          <span className={cn("num block text-[13.5px]", e.mark === "late" ? "text-late" : "text-quiet")}>{e.what}</span>
                        </span>
                        {e.amount != null && <span className="num text-[15px] font-medium">{formatMoney(e.amount)}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
