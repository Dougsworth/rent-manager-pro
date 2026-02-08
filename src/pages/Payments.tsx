import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { AddPaymentModal } from "@/components/AddPaymentModal";

interface Payment {
  id: number;
  receipt?: string;
  tenant: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
  status?: string;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Array<{ id: number; name: string; rent: number }>>([]);
  const [tenantFilter, setTenantFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  // Safe setter that ensures we always set an array
  const setSafePaymentsState = (data: any) => {
    if (Array.isArray(data)) {
      setPayments(data);
    } else {
      console.warn('Attempted to set non-array as payments:', data);
      setPayments([]);
    }
  };
  
  const setSafeTenantsState = (data: any) => {
    if (Array.isArray(data)) {
      setTenants(data.map(t => ({ id: t.id, name: t.name, rent: t.rent || t.monthly_rent || 0 })));
    } else {
      console.warn('Attempted to set non-array as tenants:', data);
      setTenants([]);
    }
  };
  
  // Ensure arrays are always arrays
  const safePaymentsArray = Array.isArray(payments) ? payments : [];
  const safeTenantsArray = Array.isArray(tenants) ? tenants : [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, tenantsRes] = await Promise.all([
        api.getPayments(),
        api.getTenants(),
      ]);

      console.log('Payments API Response:', paymentsRes); // Debug log
      console.log('Tenants API Response:', tenantsRes); // Debug log
      
      if (paymentsRes.data) {
        console.log('Payments data type:', typeof paymentsRes.data, Array.isArray(paymentsRes.data)); // Debug log
        setSafePaymentsState(paymentsRes.data);
      } else if (paymentsRes.error) {
        console.error('Payments API Error:', paymentsRes.error);
        setSafePaymentsState([]);
      } else {
        console.warn('No data or error in payments response:', paymentsRes);
        setSafePaymentsState([]);
      }
      
      if (tenantsRes.data) {
        console.log('Tenants data type:', typeof tenantsRes.data, Array.isArray(tenantsRes.data)); // Debug log
        setSafeTenantsState(tenantsRes.data);
      } else if (tenantsRes.error) {
        console.error('Tenants API Error:', tenantsRes.error);
        setSafeTenantsState([]);
      } else {
        console.warn('No data or error in tenants response:', tenantsRes);
        setSafeTenantsState([]);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      setSafePaymentsState([]);
      setSafeTenantsState([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = safePaymentsArray.filter(payment => {
    if (tenantFilter !== "all" && payment.tenant !== tenantFilter) return false;
    return true;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const handleAddPayment = async (paymentData: {
    tenantId: number;
    amount: number;
    date: string;
    method: string;
  }) => {
    try {
      const response = await api.createPayment(paymentData);
      if (response.data) {
        await loadData();
        setShowAddPayment(false);
        alert('Payment recorded successfully!');
      } else {
        alert('Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Payments" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Payments"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowAddPayment(true)}>
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const response = await api.request('/payments/export/', {
                  method: 'GET'
                });
                // Handle CSV download
                alert('Export functionality will download CSV');
              } catch (error) {
                alert('Failed to export payments');
              }
            }}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
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
            {safeTenantsArray.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.name}>
                {tenant.name}
              </SelectItem>
            ))}
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
          Showing {filteredPayments.length} payments totaling{" "}
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
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {payment.receipt || `PAY-${payment.id}`}
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
          <p className="text-sm text-muted-foreground">Showing 1-{filteredPayments.length} of {filteredPayments.length}</p>
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
      
      {/* Add Payment Modal */}
      <AddPaymentModal
        open={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        tenants={safeTenantsArray}
        onSubmit={handleAddPayment}
      />
    </AppLayout>
  );
}
