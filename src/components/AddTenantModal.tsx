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

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    name: string;
    email: string;
    phone: string;
    unit: string;
    rent: number;
    leaseStart: string;
    leaseEnd: string;
  }) => Promise<void>;
}

export function AddTenantModal({ open, onClose, onSubmit }: AddTenantModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    unit: "",
    rent: "",
    leaseStart: "",
    leaseEnd: "",
  });
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Remove all non-digit characters for phone
      const digits = value.replace(/\D/g, '');
      
      // Format as user types (XXX-XXXX for local or 876-XXX-XXXX)
      let formatted = '';
      if (digits.length <= 3) {
        formatted = digits;
      } else if (digits.length <= 7) {
        formatted = digits.slice(0, 3) + '-' + digits.slice(3);
      } else if (digits.startsWith('876')) {
        // Format as 876-XXX-XXXX
        formatted = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
      } else {
        // Format as XXX-XXXX
        formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7);
      }
      
      setFormData({ ...formData, phone: formatted });
      setPhoneError('');
    } else if (name === 'rent') {
      // Only allow numbers for rent
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, rent: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      await onSubmit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        unit: formData.unit,
        rent: parseInt(formData.rent),
        leaseStart: formData.leaseStart,
        leaseEnd: formData.leaseEnd,
      });
    }
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      unit: "",
      rent: "",
      leaseStart: "",
      leaseEnd: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="add-tenant-description">
        <DialogHeader>
          <DialogTitle>Add Tenant</DialogTitle>
        </DialogHeader>
        <p id="add-tenant-description" className="sr-only">Fill out the form below to add a new tenant to the system</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="555-1234 or 876-555-1234"
                className={phoneError ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Enter 7 digits for local or 10 digits with 876 area code
              </p>
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g., Unit 1A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent (JMD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">J$</span>
                  <Input
                    id="rent"
                    name="rent"
                    type="text"
                    inputMode="numeric"
                    value={formData.rent}
                    onChange={handleChange}
                    placeholder="45000"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaseStart">Lease Start *</Label>
                <Input
                  id="leaseStart"
                  name="leaseStart"
                  type="date"
                  value={formData.leaseStart}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEnd">Lease End *</Label>
                <Input
                  id="leaseEnd"
                  name="leaseEnd"
                  type="date"
                  value={formData.leaseEnd}
                  onChange={handleChange}
                  min={formData.leaseStart || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
