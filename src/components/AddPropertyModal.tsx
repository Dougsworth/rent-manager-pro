import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty, createUnit } from "@/services/properties";
import { createPropertySchema, createUnitSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";

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
      setError(err.message || 'That property was not added. Try again.');
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
      setError(err.message || 'That unit was not added. Try again.');
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
          <DialogTitle>{step === 1 ? 'Add property' : `Add units to ${propertyName}`}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Step 1 of 2. A building or house. You add its units next.'
              : 'Step 2 of 2. Add each unit you rent out. You can add more later on the Properties page.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div>
              <Label htmlFor="propName">Property name</Label>
              <Input
                id="propName"
                className="mt-1.5"
                required
                placeholder="Sunset Apartments"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="propAddress">Address (optional)</Label>
              <Input
                id="propAddress"
                className="mt-1.5"
                placeholder="12 Harbour St, Kingston"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
              />
            </div>
            {error && <p role="alert" className="text-sm font-medium text-late">{error}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={handleClose} className="max-sm:h-12">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="max-sm:h-12">
                {submitting ? 'Adding' : 'Add property'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {addedUnits.length > 0 && (
              <ul>
                {addedUnits.map((unit, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 border-t border-rule py-2.5 text-[15px]">
                    <span className="truncate font-medium">{unit.name}</span>
                    <span><span className="num font-semibold">{formatMoney(unit.rent)}</span><span className="text-[13.5px] text-quiet"> a month</span></span>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddUnit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="unitName">Unit name</Label>
                  <Input
                    id="unitName"
                    className="mt-1.5"
                    required
                    placeholder="Unit 1A"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="unitRent">Rent a month (J$)</Label>
                  <Input
                    id="unitRent"
                    className="num mt-1.5"
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="45000"
                    value={unitRent}
                    onChange={(e) => setUnitRent(e.target.value)}
                  />
                </div>
              </div>
              {error && <p role="alert" className="text-sm font-medium text-late">{error}</p>}
              <Button type="submit" variant="outline" className="w-full max-sm:h-12" disabled={addingUnit}>
                {addingUnit ? 'Adding' : 'Add this unit'}
              </Button>
            </form>

            <Button onClick={handleDone} className="w-full max-sm:h-12">
              {addedUnits.length === 0 ? 'Skip for now' : 'Done'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
