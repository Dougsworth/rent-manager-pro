import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties } from "@/services/properties";
import { addTenant } from "@/services/tenants";
import type { PropertyWithUnits } from "@/types/app.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unit_id: "",
    leaseStart: "",
    leaseEnd: "",
  });

  useEffect(() => {
    if (open && user) {
      getProperties(user.id).then(setProperties).catch(console.error);
    }
  }, [open, user]);

  if (!open) return null;

  const allUnits = properties.flatMap(p =>
    (p.units ?? []).map(u => ({
      id: u.id,
      label: `${p.name} — ${u.name} (J$${u.rent_amount.toLocaleString()}/mo)`,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);

    try {
      await addTenant(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        unit_id: formData.unit_id || null,
        lease_start: formData.leaseStart || null,
        lease_end: formData.leaseEnd || null,
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", unit_id: "", leaseStart: "", leaseEnd: "" });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-lg shadow-xl z-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Add Tenant</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <select
              id="unit"
              value={formData.unit_id}
              onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No unit assigned</option>
              {allUnits.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
            {allUnits.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No properties/units found. Add properties in Settings first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Tenant
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
