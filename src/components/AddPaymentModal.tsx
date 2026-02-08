import { useState } from "react";
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

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  tenants: Array<{ id: number; name: string; rent: number }>;
  onSubmit?: (data: {
    tenantId: number;
    amount: number;
    date: string;
    method: string;
  }) => Promise<void>;
}

export function AddPaymentModal({ open, onClose, tenants, onSubmit }: AddPaymentModalProps) {
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "bank_transfer",
  });
  const [loading, setLoading] = useState(false);

  const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit && formData.tenantId) {
      setLoading(true);
      try {
        await onSubmit({
          tenantId: parseInt(formData.tenantId),
          amount: parseInt(formData.amount),
          date: formData.date,
          method: formData.method,
        });
        
        // Reset form
        setFormData({
          tenantId: "",
          amount: "",
          date: new Date().toISOString().split('T')[0],
          method: "bank_transfer",
        });
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
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
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