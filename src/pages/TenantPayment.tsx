import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Download, Lock, Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

// Mock data for a payment
const mockPaymentData = {
  propertyName: "Sunset Apartments",
  propertyAddress: "123 Main Street, Kingston",
  unit: "Unit 1A",
  dueDate: "February 1, 2026",
  amount: 45000,
  lateFee: 0,
  tenantEmail: "tenant@email.com",
  isPaid: false,
  isOverdue: false,
  daysOverdue: 0,
};

export default function TenantPayment() {
  const { token } = useParams();
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Simulate checking token validity
  const isValidToken = token && token.length > 5;

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This payment link is no longer valid. Contact your landlord for a new invoice.
          </p>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-success-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Payment Received</h1>
          <p className="text-sm text-muted-foreground mb-1">
            {formatCurrency(mockPaymentData.amount)} paid on Feb 6, 2026
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            A receipt has been sent to {mockPaymentData.tenantEmail}
          </p>
          <Button variant="outline" className="mb-4">
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = mockPaymentData.amount + mockPaymentData.lateFee;

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg overflow-hidden">
        {/* Property Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">
            {mockPaymentData.propertyName}
          </h1>
          <p className="text-xs text-muted-foreground">{mockPaymentData.propertyAddress}</p>
        </div>

        {/* Invoice Details */}
        <div className="p-6 border-b border-border">
          <p className="text-sm text-foreground mb-1">Rent for {mockPaymentData.unit}</p>
          <p className={`text-xs mb-6 ${mockPaymentData.isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
            Due: {mockPaymentData.dueDate}
            {mockPaymentData.isOverdue && ` (${mockPaymentData.daysOverdue} days overdue)`}
          </p>

          <div className="text-center">
            <p className="text-3xl font-semibold text-foreground mb-2">
              {formatCurrency(totalAmount)}
            </p>
            {mockPaymentData.lateFee > 0 && (
              <p className="text-xs text-muted-foreground">
                Rent: {formatCurrency(mockPaymentData.amount)} + Late fee:{" "}
                {formatCurrency(mockPaymentData.lateFee)}
              </p>
            )}
          </div>
        </div>

        {/* Pay Button */}
        <div className="p-6">
          <Button
            className="w-full h-12 text-base"
            onClick={() => setPaymentComplete(true)}
          >
            Pay Now
          </Button>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">256-bit encrypted</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Powered by Stripe</span>
          </div>
        </div>

        {/* View History Link */}
        <div className="px-6 pb-6">
          <button className="text-xs text-primary hover:underline">View payment history</button>
        </div>
      </div>
    </div>
  );
}
