import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SlideOutPanel } from "@/components/SlideOutPanel";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoicePanel, setShowInvoicePanel] = useState(false);
  
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

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoicePanel(true);
  };

  const handleRemind = async (invoiceId: number) => {
    if (!confirm('Send payment reminder for this invoice?')) return;
    
    try {
      const response = await api.request(`/invoices/${invoiceId}/send_reminder/`, {
        method: 'POST'
      });
      
      if (response.data) {
        alert('Reminder sent successfully!');
      } else {
        alert('Failed to send reminder');
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();
      
      // Header - Company Name
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("PropertyHub Pro", 105, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("The Pods Property Management", 105, 35, { align: "center" });
      doc.text("6 University Dr, Kingston", 105, 42, { align: "center" });
      doc.text("info@thepods.com | 876-784-8380", 105, 49, { align: "center" });
      
      // Invoice Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 105, 70, { align: "center" });
      
      // Invoice Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 90);
      doc.text(`Issue Date: ${invoice.issuedDate}`, 20, 97);
      doc.text(`Due Date: ${invoice.dueDate}`, 20, 104);
      doc.text(`Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`, 20, 111);
      
      // Bill To Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, 130);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Tenant: ${invoice.tenant}`, 20, 140);
      doc.text(`Unit: ${invoice.unit}`, 20, 147);
      
      // Invoice Details Table
      autoTable(doc, {
        startY: 165,
        head: [['Description', 'Amount']],
        body: [
          [`Monthly rent for ${invoice.unit}`, `J$${invoice.amount.toLocaleString()}`]
        ],
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 12,
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        bodyStyles: {
          fontSize: 11,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        columnStyles: {
          1: { halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        theme: 'plain'
      });
      
      // Total Amount Box
      const finalY = (doc as any).lastAutoTable.finalY || 185;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(120, finalY + 10, 70, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text('Total Due:', 125, finalY + 18);
      doc.text(`J$${invoice.amount.toLocaleString()}`, 185, finalY + 18, { align: 'right' });
      
      // Payment Instructions
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text('Payment Instructions:', 20, finalY + 40);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const instructions = [
        '• Please make payment by the due date to avoid late fees',
        '• Contact us immediately if you have any questions',
        '• Include your invoice number with your payment',
        '• For inquiries: 876-784-8380 or info@thepods.com'
      ];
      
      let yPos = finalY + 50;
      instructions.forEach((line) => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.text("Thank you for your business!", 105, 270, { align: "center" });
      doc.text("PropertyHub Pro - Professional Property Management", 105, 275, { align: "center" });
      
      // Save the PDF
      doc.save(`invoice_${invoice.invoiceNumber}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
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
                      <button 
                        className="text-sm text-primary hover:underline"
                        onClick={() => handleView(invoice)}
                      >
                        View
                      </button>
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

      {/* Invoice Detail Panel */}
      <SlideOutPanel
        open={showInvoicePanel}
        onClose={() => setShowInvoicePanel(false)}
        title="Invoice Details"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{selectedInvoice.invoiceNumber}</h3>
                <StatusBadge variant={selectedInvoice.status}>{selectedInvoice.status}</StatusBadge>
              </div>
              <p className="text-muted-foreground">Issued: {selectedInvoice.issuedDate}</p>
            </div>

            {/* Tenant Information */}
            <div>
              <h4 className="font-medium mb-3">Tenant Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{selectedInvoice.tenant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit:</span>
                  <span>{selectedInvoice.unit}</span>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h4 className="font-medium mb-3">Invoice Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className={selectedInvoice.status === "overdue" ? "text-destructive font-medium" : ""}>
                    {selectedInvoice.dueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border space-y-3">
              <Button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                variant="outline"
                className="w-full"
              >
                Download PDF Invoice
              </Button>
              {selectedInvoice.status !== "paid" && (
                <Button
                  onClick={() => handleRemind(selectedInvoice.id)}
                  className="w-full"
                >
                  Send Payment Reminder
                </Button>
              )}
            </div>
          </div>
        )}
      </SlideOutPanel>
    </AppLayout>
  );
}
