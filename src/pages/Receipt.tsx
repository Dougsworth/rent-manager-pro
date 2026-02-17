import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Download } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

interface ReceiptData {
  id: number;
  reference_number: string;
  tenant_name: string;
  tenant_unit: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
}

export default function Receipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id || id.length <= 3) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadReceipt = async () => {
      try {
        const response = await api.getPayment(parseInt(id));
        if (response.data) {
          setReceipt(response.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Receipt not found. Please check the link or contact your landlord.
          </p>
        </div>
      </div>
    );
  }

  const paymentDate = new Date(receipt.payment_date);
  const formattedDate = paymentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const methodLabels: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    check: "Check",
    card: "Credit/Debit Card",
    mobile_money: "Mobile Money",
    other: "Other",
  };

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-lg overflow-hidden">
        {/* Header with Download */}
        <div className="p-6 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              RECEIPT
            </p>
            <p className="text-sm font-semibold text-foreground">{receipt.reference_number}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await api.downloadReceipt(receipt.id);
              } catch {
                // Silently fail for public page
              }
            }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* From / To */}
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">From</p>
            <p className="text-sm font-medium text-foreground">The Pods</p>
            <p className="text-xs text-muted-foreground">6 University Dr, Kingston</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">To</p>
            <p className="text-sm font-medium text-foreground">{receipt.tenant_name}</p>
            <p className="text-xs text-muted-foreground">{receipt.tenant_unit}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Payment Details */}
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="text-sm text-foreground">Monthly Rent — {receipt.tenant_unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(receipt.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm text-foreground">
                {methodLabels[receipt.payment_method] || receipt.payment_method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge variant="paid">Paid</StatusBadge>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Total */}
        <div className="p-6 flex justify-between items-center">
          <span className="text-base font-semibold text-foreground">Total Paid</span>
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(receipt.amount)}
          </span>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-muted-foreground text-center">
            This receipt was automatically generated by Unitly
          </p>
        </div>
      </div>
    </div>
  );
}
