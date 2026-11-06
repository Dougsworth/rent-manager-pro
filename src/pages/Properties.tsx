import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProperties,
  createProperty,
  createUnit,
  updateProperty,
  deleteProperty,
  updateUnit,
  deleteUnit,
  getPropertyOccupancy,
} from '@/services/properties';
import { createPropertySchema, createUnitSchema } from '@/schemas';
import type { PropertyWithUnits } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { PropertiesSkeleton } from '@/components/skeletons/PropertiesSkeleton';
import { formatMoney } from '@/lib/money';

type OccupancyMap = Map<string, { tenant_name: string; tenant_id: string }>;

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function DialogButtons({ busy, label, busyLabel, onCancel, destructive, onConfirm }: {
  busy: boolean;
  label: string;
  busyLabel: string;
  onCancel: () => void;
  destructive?: boolean;
  /** When set the primary button is a plain button, otherwise it submits the form. */
  onConfirm?: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel} className="max-sm:h-12">Cancel</Button>
      <Button
        type={onConfirm ? 'button' : 'submit'}
        variant={destructive ? 'destructive' : 'default'}
        onClick={onConfirm}
        disabled={busy}
        className="max-sm:h-12"
      >
        {busy ? busyLabel : label}
      </Button>
    </div>
  );
}

function occupancyWords(let_: number, total: number) {
  if (total === 0) return 'No units yet';
  if (let_ === 0) return `${total} ${total === 1 ? 'unit' : 'units'}, all vacant`;
  return `${let_} of ${total} let`;
}

export default function Properties() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyMap>(new Map());
  const [loading, setLoading] = useState(true);

  // Add property
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  const [addingProperty, setAddingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState('');

  // Add unit
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRent, setNewUnitRent] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [showAddUnitFor, setShowAddUnitFor] = useState<string | null>(null);
  const [unitError, setUnitError] = useState('');

  // Edit property dialog
  const [editProperty, setEditProperty] = useState<PropertyWithUnits | null>(null);
  const [editPropName, setEditPropName] = useState('');
  const [editPropAddress, setEditPropAddress] = useState('');
  const [savingProperty, setSavingProperty] = useState(false);

  // Edit unit dialog
  const [editUnit, setEditUnit] = useState<{ id: string; name: string; rent_amount: number } | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitRent, setEditUnitRent] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  // Delete dialogs
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [props, occ] = await Promise.all([
        getProperties(user.id),
        getPropertyOccupancy(user.id),
      ]);
      setProperties(props);
      setOccupancy(occ);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPropertyError('');

    const result = createPropertySchema.safeParse({ name: newPropertyName, address: newPropertyAddress });
    if (!result.success) { setPropertyError(result.error.issues[0].message); return; }

    setAddingProperty(true);
    try {
      await createProperty(user.id, newPropertyName.trim(), newPropertyAddress.trim());
      setNewPropertyName('');
      setNewPropertyAddress('');
      setShowAddProperty(false);
      toast('Property added. Add its units next.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to add property:', err);
      toast('That property was not added. Try again.', 'error');
    } finally {
      setAddingProperty(false);
    }
  };

  const openAddUnit = (propertyId: string) => {
    setShowAddUnitFor(propertyId);
    setNewUnitName('');
    setNewUnitRent('');
    setUnitError('');
  };

  const handleAddUnit = async (e: React.FormEvent, propertyId: string) => {
    e.preventDefault();
    setUnitError('');

    const result = createUnitSchema.safeParse({ name: newUnitName, rentAmount: newUnitRent });
    if (!result.success) { setUnitError(result.error.issues[0].message); return; }

    setAddingUnit(true);
    try {
      await createUnit(propertyId, newUnitName.trim(), parseInt(newUnitRent));
      setNewUnitName('');
      setNewUnitRent('');
      setShowAddUnitFor(null);
      toast('Unit added.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to add unit:', err);
      toast('That unit was not added. Try again.', 'error');
    } finally {
      setAddingUnit(false);
    }
  };

  const handleEditProperty = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editProperty) return;
    const result = createPropertySchema.safeParse({ name: editPropName, address: editPropAddress });
    if (!result.success) { toast(result.error.issues[0].message, 'error'); return; }

    setSavingProperty(true);
    try {
      await updateProperty(editProperty.id, { name: editPropName.trim(), address: editPropAddress.trim() });
      setEditProperty(null);
      toast('Property saved.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to update property:', err);
      toast('Your changes were not saved. Try again.', 'error');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleEditUnit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editUnit) return;
    const result = createUnitSchema.safeParse({ name: editUnitName, rentAmount: editUnitRent });
    if (!result.success) { toast(result.error.issues[0].message, 'error'); return; }

    setSavingUnit(true);
    try {
      await updateUnit(editUnit.id, { name: editUnitName.trim(), rent_amount: parseInt(editUnitRent) });
      setEditUnit(null);
      toast('Unit saved.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to update unit:', err);
      toast('Your changes were not saved. Try again.', 'error');
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!deletePropertyId) return;
    setDeletingProperty(true);
    try {
      await deleteProperty(deletePropertyId);
      setDeletePropertyId(null);
      toast('Property deleted.', 'success');
      await loadData();
    } catch (err: any) {
      toast(err.message || 'That property was not deleted. Try again.', 'error');
    } finally {
      setDeletingProperty(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitId) return;
    setDeletingUnit(true);
    try {
      await deleteUnit(deleteUnitId);
      setDeleteUnitId(null);
      toast('Unit deleted.', 'success');
      await loadData();
    } catch (err: any) {
      toast(err.message || 'That unit was not deleted. Try again.', 'error');
    } finally {
      setDeletingUnit(false);
    }
  };

  if (loading) return <PropertiesSkeleton />;

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const occupiedUnits = properties.reduce((sum, p) => {
    return sum + (p.units ?? []).filter(u => occupancy.has(u.id)).length;
  }, 0);
  const totalMonthlyRent = properties.reduce((sum, p) => {
    return sum + (p.units ?? []).reduce((s, u) => s + u.rent_amount, 0);
  }, 0);

  const openAddProperty = () => { setPropertyError(''); setShowAddProperty(true); };

  return (
    <>
      <PageHeader
        title="Properties"
        count={properties.length}
        action={
          properties.length > 0 ? (
            <Button onClick={openAddProperty} className="max-sm:h-12 max-sm:w-full">Add property</Button>
          ) : undefined
        }
      />

      {properties.length > 0 && (
        <p className="mb-8 text-[15px]">
          {totalUnits === 0 ? (
            <>No units yet. Add units to a property to start placing tenants.</>
          ) : (
            <>
              <b className="num font-semibold">{occupiedUnits} of {totalUnits}</b> units let.{' '}
              <span className="text-quiet">Fully let, they bring in <span className="num">{formatMoney(totalMonthlyRent)}</span> a month.</span>
            </>
          )}
        </p>
      )}

      {properties.length === 0 ? (
        <EmptyState
          message="No properties yet"
          description="Add a building or house, then its units. Tenants are placed in units."
          action={<Button onClick={openAddProperty}>Add property</Button>}
        />
      ) : (
        <div className="space-y-12">
          {properties.map((property) => {
            const units = property.units ?? [];
            const occupied = units.filter(u => occupancy.has(u.id)).length;
            const propertyRent = units.reduce((s, u) => s + u.rent_amount, 0);
            const adding = showAddUnitFor === property.id;

            return (
              <section key={property.id} aria-labelledby={`prop-${property.id}`}>
                <div className="flex items-start justify-between gap-x-4 pb-3 sm:items-end">
                  <div className="min-w-0">
                    <h2 id={`prop-${property.id}`} className="text-xl font-semibold leading-tight">{property.name}</h2>
                    <p className="mt-0.5 text-[13.5px] text-quiet">
                      {[property.address, occupancyWords(occupied, units.length), units.length > 0 ? `${formatMoney(propertyRent)} a month` : null].filter(Boolean).join('. ')}
                    </p>
                  </div>
                  <div className="-mr-3 flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditProperty(property);
                        setEditPropName(property.name);
                        setEditPropAddress(property.address ?? '');
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-late" onClick={() => setDeletePropertyId(property.id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                <ul>
                  {units.map((unit) => {
                    const tenant = occupancy.get(unit.id);
                    return (
                      <li
                        key={unit.id}
                        className="grid grid-cols-[1fr_auto] items-start gap-x-4 border-t border-rule py-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium">{unit.name}</p>
                          {tenant ? (
                            <Link to={`/tenants/${tenant.tenant_id}`} className="block truncate text-[13.5px] text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
                              {tenant.tenant_name}
                            </Link>
                          ) : (
                            <p className="text-[13.5px] text-quiet">Vacant</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end sm:contents">
                          <p className="text-right sm:text-left">
                            <span className="num font-semibold">{formatMoney(unit.rent_amount)}</span>
                            <span className="text-[13.5px] text-quiet"> a month</span>
                          </p>
                          <div className="-mr-3 flex sm:justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-quiet hover:text-ink"
                              aria-label={`Edit ${unit.name}`}
                              onClick={() => {
                                setEditUnit(unit);
                                setEditUnitName(unit.name);
                                setEditUnitRent(String(unit.rent_amount));
                              }}
                            >
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-quiet hover:text-late" aria-label={`Delete ${unit.name}`} onClick={() => setDeleteUnitId(unit.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  <li className="border-t border-rule py-3">
                    {adding ? (
                      <form
                        onSubmit={(e) => handleAddUnit(e, property.id)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setShowAddUnitFor(null); }}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,240px)_180px_auto] sm:items-end"
                      >
                        <div className="col-span-2 sm:col-span-1">
                          <Label htmlFor={`unit-name-${property.id}`}>Unit name</Label>
                          <Input
                            id={`unit-name-${property.id}`}
                            className="mt-1.5"
                            autoFocus
                            placeholder="Unit 1A"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label htmlFor={`unit-rent-${property.id}`}>Rent a month (J$)</Label>
                          <Input
                            id={`unit-rent-${property.id}`}
                            className="num mt-1.5"
                            type="number"
                            inputMode="numeric"
                            placeholder="45000"
                            value={newUnitRent}
                            onChange={(e) => setNewUnitRent(e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex gap-2 sm:col-span-1">
                          <Button type="submit" disabled={addingUnit} className="flex-1 max-sm:h-12 sm:flex-none">{addingUnit ? 'Adding' : 'Add unit'}</Button>
                          <Button type="button" variant="ghost" onClick={() => setShowAddUnitFor(null)} className="max-sm:h-12">Cancel</Button>
                        </div>
                        {unitError && <p role="alert" className="col-span-2 text-sm font-medium text-late sm:col-span-3">{unitError}</p>}
                      </form>
                    ) : (
                      <Button variant="ghost" size="sm" className="-ml-3" onClick={() => openAddUnit(property.id)}>
                        Add unit
                      </Button>
                    )}
                  </li>
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Add property */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
            <DialogDescription>A building or house. You add its units after.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProperty} className="space-y-4">
            <Field id="propName" label="Property name">
              <Input id="propName" required placeholder="Sunset Apartments" value={newPropertyName} onChange={(e) => setNewPropertyName(e.target.value)} />
            </Field>
            <Field id="propAddr" label="Address (optional)">
              <Input id="propAddr" placeholder="12 Harbour St, Kingston" value={newPropertyAddress} onChange={(e) => setNewPropertyAddress(e.target.value)} />
            </Field>
            {propertyError && <p role="alert" className="text-sm font-medium text-late">{propertyError}</p>}
            <DialogButtons busy={addingProperty} label="Add property" busyLabel="Adding" onCancel={() => setShowAddProperty(false)} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit property */}
      <Dialog open={!!editProperty} onOpenChange={(open) => { if (!open) setEditProperty(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit property</DialogTitle></DialogHeader>
          <form onSubmit={handleEditProperty} className="space-y-4">
            <Field id="editPropName" label="Property name">
              <Input id="editPropName" value={editPropName} onChange={(e) => setEditPropName(e.target.value)} />
            </Field>
            <Field id="editPropAddr" label="Address">
              <Input id="editPropAddr" value={editPropAddress} onChange={(e) => setEditPropAddress(e.target.value)} />
            </Field>
            <DialogButtons busy={savingProperty} label="Save changes" busyLabel="Saving" onCancel={() => setEditProperty(null)} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit unit */}
      <Dialog open={!!editUnit} onOpenChange={(open) => { if (!open) setEditUnit(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit unit</DialogTitle></DialogHeader>
          <form onSubmit={handleEditUnit} className="space-y-4">
            <Field id="editUnitName" label="Unit name">
              <Input id="editUnitName" value={editUnitName} onChange={(e) => setEditUnitName(e.target.value)} />
            </Field>
            <Field id="editUnitRent" label="Rent a month (J$)">
              <Input id="editUnitRent" className="num" type="number" inputMode="numeric" value={editUnitRent} onChange={(e) => setEditUnitRent(e.target.value)} />
            </Field>
            <DialogButtons busy={savingUnit} label="Save changes" busyLabel="Saving" onCancel={() => setEditUnit(null)} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete property */}
      <Dialog open={!!deletePropertyId} onOpenChange={(open) => { if (!open) setDeletePropertyId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this property?</DialogTitle>
            <DialogDescription>
              The property and all its units are deleted for good. Tenants in those units lose their unit but stay in your records.
            </DialogDescription>
          </DialogHeader>
          <DialogButtons busy={deletingProperty} label="Delete property" busyLabel="Deleting" destructive onConfirm={handleDeleteProperty} onCancel={() => setDeletePropertyId(null)} />
        </DialogContent>
      </Dialog>

      {/* Delete unit */}
      <Dialog open={!!deleteUnitId} onOpenChange={(open) => { if (!open) setDeleteUnitId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this unit?</DialogTitle>
            <DialogDescription>The unit is deleted for good. A tenant in it stays in your records without a unit.</DialogDescription>
          </DialogHeader>
          <DialogButtons busy={deletingUnit} label="Delete unit" busyLabel="Deleting" destructive onConfirm={handleDeleteUnit} onCancel={() => setDeleteUnitId(null)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
