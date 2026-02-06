import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payment {
  id: number;
  receipt: string;
  tenant: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
}

const mockPayments: Payment[] = [
  { id: 1, receipt: "RCP-2026-0201", tenant: "Marcus Brown", unit: "Unit 1A", amount: 45000, date: "Feb 1, 2026, 2:34 PM", method: "Bank Transfer" },
  { id: 2, receipt: "RCP-2026-0202", tenant: "Angela Chen", unit: "Unit 2B", amount: 42000, date: "Feb 1, 2026, 10:15 AM", method: "Card" },
  { id: 3, receipt: "RCP-2026-0101", tenant: "Marcus Brown", unit: "Unit 1A", amount: 45000, date: "Jan 1, 2026, 9:20 AM", method: "Bank Transfer" },
  { id: 4, receipt: "RCP-2026-0102", tenant: "Angela Chen", unit: "Unit 2B", amount: 42000, date: "Jan 1, 2026, 11:45 AM", method: "Card" },
  { id: 5, receipt: "RCP-2026-0103", tenant: "David Williams", unit: "Unit 3C", amount: 48000, date: "Jan 2, 2026, 3:10 PM", method: "Bank Transfer" },
];

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Payments() {
  const [tenantFilter, setTenantFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const totalAmount = mockPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout>
      <PageHeader
        title="Payments"
        action={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            <SelectItem value="marcus">Marcus Brown</SelectItem>
            <SelectItem value="angela">Angela Chen</SelectItem>
            <SelectItem value="david">David Williams</SelectItem>
            <SelectItem value="sarah">Sarah Thompson</SelectItem>
            <SelectItem value="michael">Michael Lee</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-36"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-36"
          />
        </div>
        <Button variant="outline" size="sm">
          Apply
        </Button>
        <button className="text-sm text-primary hover:underline">Clear</button>
      </div>

      {/* Summary Bar */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {mockPayments.length} payments totaling{" "}
          <span className="font-medium text-foreground">{formatCurrency(totalAmount)}</span>
        </p>
      </div>

      {/* Payment Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Receipt #
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
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase font-medium tracking-wide text-muted-foreground hidden lg:table-cell">
                  Method
                </th>
                <th className="px-4 py-3 text-center text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {payment.receipt}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{payment.tenant}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {payment.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-success">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    {payment.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {payment.method}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-primary hover:underline inline-flex items-center gap-1">
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 1-5 of 5</p>
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
    </AppLayout>
  );
}
