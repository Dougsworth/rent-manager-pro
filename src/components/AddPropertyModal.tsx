import { useState } from "react";
import { Loader2, Plus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty, createUnit } from "@/services/properties";
import { createPropertySchema, createUnitSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPropertyModal({ open, onClose, onSuccess }: AddPropertyModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Property
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  // Step 2: Units
  const [unitName, setUnitName] = useState('');
  const [unitRent, setUnitRent] = useState('');
  const [addedUnits, setAddedUnits] = useState<{ name: string; rent: number }[]>([]);
  const [addingUnit, setAddingUnit] = useState(false);

  const reset = () => {
    setStep(1);
    setPropertyName('');
    setPropertyAddress('');
    setCreatedPropertyId(null);
    setUnitName('');
    setUnitRent('');
    setAddedUnits([]);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    const result = createPropertySchema.safeParse({ name: propertyName, address: propertyAddress });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const property = await createProperty(user.id, propertyName.trim(), propertyAddress.trim());
      setCreatedPropertyId(property.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdPropertyId) return;
    setError('');

    const result = createUnitSchema.safeParse({ name: unitName, rentAmount: unitRent });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setAddingUnit(true);
    try {
      await createUnit(createdPropertyId, unitName.trim(), parseInt(unitRent));
      setAddedUnits(prev => [...prev, { name: unitName.trim(), rent: parseInt(unitRent) }]);
      setUnitName('');
      setUnitRent('');
    } catch (err: any) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setAddingUnit(false);
    }
  };

  const handleDone = () => {
    onSuccess?.();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Add Property' : 'Add Units'}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Create a new property to start managing units and tenants.'
              : `Add units to ${propertyName}. You can add more later in Settings.`}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
          </div>
          <div className={`h-0.5 flex-1 ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            2
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propName">Property Name *</Label>
              <Input
                id="propName"
                required
                placeholder="e.g. Sunset Apartments"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propAddress">Address</Label>
              <Input
                id="propAddress"
                placeholder="e.g. 12 Harbour St, Kingston"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Property
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Added units list */}
            {addedUnits.length > 0 && (
              <div className="space-y-2">
                {addedUnits.map((unit, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-900">{unit.name}</span>
                    <span className="text-sm font-bold text-blue-600">J${unit.rent.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add unit form */}
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="unitName">Unit Name</Label>
                  <Input
                    id="unitName"
                    required
                    placeholder="e.g. Unit 1A"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitRent">Rent (J$)</Label>
                  <Input
                    id="unitRent"
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={unitRent}
                    onChange={(e) => setUnitRent(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={addingUnit}>
                {addingUnit ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Unit
              </Button>
            </form>

            <Button onClick={handleDone} className="w-full">
              {addedUnits.length === 0 ? 'Skip for Now' : 'Done'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
