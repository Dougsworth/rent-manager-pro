import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";

type InvoiceStatus = "all" | "paid" | "pending" | "overdue";

interface Invoice {
  id: number;
  invoiceNumber: string;
  tenant: string;
  unit: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  issuedDate: string;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<InvoiceStatus>("all");
  const [dateRange, setDateRange] = useState("this-month");
  const [loading, setLoading] = useState(true);
  
  // Safe setter that ensures we always set an array
  const setSafeInvoicesState = (data: any) => {
    if (Array.isArray(data)) {
      setInvoices(data);
    } else {
      console.warn('Attempted to set non-array as invoices:', data);
      setInvoices([]);
    }
  };
  
  // Ensure invoices is always an array
  const safeInvoicesArray = Array.isArray(invoices) ? invoices : [];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.getInvoices();
      console.log('Invoices API Response:', response); // Debug log
      if (response.data) {
        console.log('Invoices data type:', typeof response.data, Array.isArray(response.data)); // Debug log
        setSafeInvoicesState(response.data);
      } else if (response.error) {
        console.error('Invoices API Error:', response.error);
        setSafeInvoicesState([]);
      } else {
        console.warn('No data or error in invoices response:', response);
        setSafeInvoicesState([]);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setSafeInvoicesState([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = safeInvoicesArray.filter(
    (inv) => activeTab === "all" || inv.status === activeTab
  );

  const counts = {
    all: safeInvoicesArray.length,
    paid: safeInvoicesArray.filter((i) => i.status === "paid").length,
    pending: safeInvoicesArray.filter((i) => i.status === "pending").length,
    overdue: safeInvoicesArray.filter((i) => i.status === "overdue").length,
  };

  const tabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "paid" as const, label: "Paid", count: counts.paid },
    { value: "pending" as const, label: "Pending", count: counts.pending },
    { value: "overdue" as const, label: "Overdue", count: counts.overdue },
  ];

  const handleCreateInvoice = async () => {
    if (!confirm('Create invoices for all active tenants for the current month?')) return;
    
    try {
      const response = await api.request('/invoices/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });
      
      if (response.data) {
        alert(`Created ${response.data.created_count} invoices successfully!`);
        await loadInvoices();
      } else {
        alert('Failed to create invoices');
      }
    } catch (error) {
      console.error('Failed to create invoices:', error);
      alert('Failed to create invoices');
    }
  };

  const handleRemind = async (invoiceId: number) => {
    if (!confirm('Send payment reminder for this invoice?')) return;
    
    try {
      await api.request(`/invoices/${invoiceId}/send/`, {
        method: 'POST'
      });
      alert('Reminder sent successfully!');
    } catch (error) {
      alert('Failed to send reminder');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Invoices" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Invoices"
        action={
          <Button onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <FilterTabs<InvoiceStatus> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden md:table-cell">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden sm:table-cell">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{invoice.tenant}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {invoice.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">
                    <span className={invoice.status === "overdue" ? "text-destructive" : "text-muted-foreground"}>
                      {invoice.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-sm text-primary hover:underline">View</button>
                      {invoice.status !== "paid" && (
                        <button 
                          className="text-sm text-primary hover:underline"
                          onClick={() => handleRemind(invoice.id)}
                        >
                          Remind
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 1-{filteredInvoices.length} of {filteredInvoices.length}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Auto-Schedule Card */}
      <div className="mt-6 bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Automatic Invoicing</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-success">On</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Invoices are sent on the <strong>1st</strong> of each month with a <strong>3</strong>-day grace period
        </p>
        <button className="text-sm text-primary hover:underline">Edit Schedule</button>
      </div>
    </AppLayout>
  );
}
