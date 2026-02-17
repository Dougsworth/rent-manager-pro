import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, CheckCircle } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  balance_due: number;
  due_date: string;
  status: string;
}

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  tenants: Array<{ id: number; name: string; rent: number }>;
  onSubmit?: (data: {
    tenantId: number;
    amount: number;
    date: string;
    method: string;
    invoice?: number;
  }) => Promise<any>;
}

export function AddPaymentModal({ open, onClose, tenants, onSubmit }: AddPaymentModalProps) {
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "bank_transfer",
    invoiceId: "",
  });
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Success state
  const [successData, setSuccessData] = useState<{
    receiptNumber: string;
    paymentId: number;
    amount: number;
    tenantName: string;
  } | null>(null);

  const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId);

  // Load invoices when tenant changes
  useEffect(() => {
    if (formData.tenantId) {
      loadInvoices(parseInt(formData.tenantId));
    } else {
      setInvoices([]);
      setFormData(prev => ({ ...prev, invoiceId: "" }));
    }
  }, [formData.tenantId]);

  const loadInvoices = async (tenantId: number) => {
    setLoadingInvoices(true);
    try {
      const response = await api.getInvoicesForTenant(tenantId);
      if (response.data) {
        setInvoices(response.data as Invoice[]);
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit && formData.tenantId) {
      setLoading(true);
      try {
        const paymentData: any = {
          tenantId: parseInt(formData.tenantId),
          amount: parseInt(formData.amount),
          date: formData.date,
          method: formData.method,
        };

        if (formData.invoiceId) {
          paymentData.invoice = parseInt(formData.invoiceId);
        }

        const result = await onSubmit(paymentData);

        if (result?.data) {
          setSuccessData({
            receiptNumber: result.data.reference_number || result.data.receipt || 'N/A',
            paymentId: result.data.id,
            amount: parseInt(formData.amount),
            tenantName: selectedTenant?.name || '',
          });
        }
      } catch (error) {
        console.error('Failed to record payment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id.toString() === tenantId);
    setFormData({
      ...formData,
      tenantId,
      amount: tenant ? tenant.rent.toString() : "",
      invoiceId: "",
    });
  };

  const handleInvoiceChange = (invoiceId: string) => {
    if (invoiceId === "none") {
      setFormData({ ...formData, invoiceId: "" });
      return;
    }
    const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
    setFormData({
      ...formData,
      invoiceId,
      amount: invoice ? Math.round(invoice.balance_due).toString() : formData.amount,
    });
  };

  const handleClose = () => {
    setSuccessData(null);
    setFormData({
      tenantId: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      method: "bank_transfer",
      invoiceId: "",
    });
    setInvoices([]);
    onClose();
  };

  // Success view
  if (successData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="payment-success-description">
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Payment Recorded</h3>
              <p id="payment-success-description" className="text-sm text-muted-foreground">
                J${successData.amount.toLocaleString()} from {successData.tenantName}
              </p>
            </div>
            <div className="bg-secondary rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Receipt Number</p>
              <p className="text-sm font-mono font-semibold text-foreground">{successData.receiptNumber}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await api.downloadReceipt(successData.paymentId);
                  } catch {
                    toast.error('Failed to download receipt');
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
              <Button size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="add-payment-description">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <p id="add-payment-description" className="sr-only">Fill out the form below to record a new payment</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={handleTenantChange}
                required
              >
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name} - J${tenant.rent.toLocaleString()}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice selector */}
            {formData.tenantId && (
              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice (optional)</Label>
                <Select
                  value={formData.invoiceId || "none"}
                  onValueChange={handleInvoiceChange}
                >
                  <SelectTrigger id="invoice">
                    <SelectValue placeholder={loadingInvoices ? "Loading..." : "No invoice"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No invoice</SelectItem>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id.toString()}>
                        {invoice.invoice_number} - J${Math.round(invoice.balance_due).toLocaleString()} due {invoice.due_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (JMD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">J$</span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={formData.amount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, amount: numericValue });
                  }}
                  placeholder="0"
                  className="pl-8"
                  required
                />
              </div>
              {selectedTenant && (
                <p className="text-xs text-muted-foreground">
                  Monthly rent: J${selectedTenant.rent.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Payment Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.tenantId || !formData.amount}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
