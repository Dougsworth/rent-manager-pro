import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties } from "@/services/properties";
import { updateTenant } from "@/services/tenants";
import { addTenantSchema } from "@/schemas";
import type { PropertyWithUnits, TenantWithDetails } from "@/types/app.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NO_UNIT = "__none__";

interface EditTenantModalProps {
  open: boolean;
  tenant: TenantWithDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTenantModal({ open, tenant, onClose, onSuccess }: EditTenantModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unit_id: NO_UNIT,
    leaseStart: "",
    leaseEnd: "",
  });

  useEffect(() => {
    if (open && user) {
      getProperties(user.id).then(setProperties).catch(console.error);
    }
  }, [open, user]);

  // Pre-fill form when tenant changes
  useEffect(() => {
    if (tenant && open) {
      setFormData({
        firstName: tenant.first_name ?? "",
        lastName: tenant.last_name ?? "",
        email: tenant.email ?? "",
        phone: tenant.phone ?? "",
        unit_id: tenant.unit_id ?? NO_UNIT,
        leaseStart: tenant.lease_start ?? "",
        leaseEnd: tenant.lease_end ?? "",
      });
      setError('');
    }
  }, [tenant, open]);

  const allUnits = properties.flatMap(p =>
    (p.units ?? []).map(u => ({
      id: u.id,
      label: `${p.name} — ${u.name} (J$${u.rent_amount.toLocaleString()}/mo)`,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tenant) return;
    setError('');

    const result = addTenantSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await updateTenant(tenant.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        unit_id: formData.unit_id === NO_UNIT ? null : formData.unit_id,
        lease_start: formData.leaseStart || null,
        lease_end: formData.leaseEnd || null,
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unit">Unit</Label>
            <Select
              id="edit-unit"
              value={formData.unit_id}
              onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
              placeholder="No unit assigned"
              options={[
                { value: NO_UNIT, label: 'No unit assigned' },
                ...allUnits.map(u => ({ value: u.id, label: u.label })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-leaseStart">Lease Start</Label>
              <Input
                id="edit-leaseStart"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leaseEnd">Lease End</Label>
              <Input
                id="edit-leaseEnd"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
