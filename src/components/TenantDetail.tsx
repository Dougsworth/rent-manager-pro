import type { Tenant } from "@/pages/Tenants";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TenantDetailProps {
  tenant: Tenant;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Mock payment history
const mockPayments = [
  { id: 1, date: "Feb 1, 2026", amount: 45000, method: "Bank Transfer", receipt: "RCP-2026-0201" },
  { id: 2, date: "Jan 1, 2026", amount: 45000, method: "Card", receipt: "RCP-2026-0101" },
  { id: 3, date: "Dec 1, 2025", amount: 45000, method: "Bank Transfer", receipt: "RCP-2025-1201" },
];

export function TenantDetail({ tenant }: TenantDetailProps) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusBadge variant={tenant.status}>{tenant.status}</StatusBadge>
      </div>

      {/* Details Section */}
      <section>
        <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
          Details
        </h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Unit</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.unit}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Rent Amount</dt>
            <dd className="text-sm font-medium text-foreground">{formatCurrency(tenant.rent)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Lease Start</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(tenant.leaseStart)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Lease End</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(tenant.leaseEnd)}</dd>
          </div>
        </dl>
      </section>

      {/* Payment History Section */}
      <section>
        <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
          Payment History
        </h3>
        {mockPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 py-2 text-foreground">{payment.date}</td>
                    <td className="px-3 py-2 text-right text-success font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button className="text-primary hover:underline inline-flex items-center gap-1">
                        <Download className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Actions Section */}
      {(tenant.status === "pending" || tenant.status === "overdue") && (
        <section>
          <h3 className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-3">
            Actions
          </h3>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full">
              Send Reminder
            </Button>
            <Button variant="outline" className="w-full">
              Create Invoice
            </Button>
          </div>
        </section>
      )}

      {/* Delete */}
      <div className="pt-4 border-t border-border">
        <button className="text-sm text-destructive hover:underline">
          Remove tenant
        </button>
      </div>
    </div>
  );
}
