import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  Home, Plus, Loader2, ChevronDown, ChevronRight,
  Edit2, Trash2, Users, MapPin,
} from 'lucide-react';
import { PropertiesSkeleton } from '@/components/skeletons/PropertiesSkeleton';

type OccupancyMap = Map<string, { tenant_name: string; tenant_id: string }>;

export default function Properties() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

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
      toast('Property added successfully!', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to add property:', err);
      toast('Failed to add property.', 'error');
    } finally {
      setAddingProperty(false);
    }
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
      toast('Unit added successfully!', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to add unit:', err);
      toast('Failed to add unit.', 'error');
    } finally {
      setAddingUnit(false);
    }
  };

  const handleEditProperty = async () => {
    if (!editProperty) return;
    const result = createPropertySchema.safeParse({ name: editPropName, address: editPropAddress });
    if (!result.success) { toast(result.error.issues[0].message, 'error'); return; }

    setSavingProperty(true);
    try {
      await updateProperty(editProperty.id, { name: editPropName.trim(), address: editPropAddress.trim() });
      setEditProperty(null);
      toast('Property updated!', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to update property:', err);
      toast('Failed to update property.', 'error');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleEditUnit = async () => {
    if (!editUnit) return;
    const result = createUnitSchema.safeParse({ name: editUnitName, rentAmount: editUnitRent });
    if (!result.success) { toast(result.error.issues[0].message, 'error'); return; }

    setSavingUnit(true);
    try {
      await updateUnit(editUnit.id, { name: editUnitName.trim(), rent_amount: parseInt(editUnitRent) });
      setEditUnit(null);
      toast('Unit updated!', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to update unit:', err);
      toast('Failed to update unit.', 'error');
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
      toast(err.message || 'Failed to delete property.', 'error');
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
      toast(err.message || 'Failed to delete unit.', 'error');
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

  return (
    <>
      <PageHeader
        title="Properties"
        description="Manage your properties and units"
        count={properties.length}
        action={
          <Button onClick={() => setShowAddProperty(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3">
            <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
            <p className="text-sm text-slate-500">Properties</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl font-bold text-slate-900">{totalUnits}</p>
            <p className="text-sm text-slate-500">Total Units</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl font-bold text-emerald-600">{occupiedUnits}/{totalUnits}</p>
            <p className="text-sm text-slate-500">Occupied</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl font-bold text-slate-700">J${totalMonthlyRent.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Monthly Rent</p>
          </div>
        </div>
      </div>

      {/* Add Property Dialog */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="max-w-md">
          <DialogTitle>New Property</DialogTitle>
          <DialogDescription>Add a property to start tracking units and tenants.</DialogDescription>

          <form onSubmit={handleAddProperty} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="propName" className="text-sm font-medium text-slate-700 mb-1.5 block">Property Name</Label>
              <Input
                id="propName"
                required
                placeholder="e.g. Sunset Apartments"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="propAddr" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Address <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="propAddr"
                placeholder="e.g. 12 Harbour St, Kingston"
                value={newPropertyAddress}
                onChange={(e) => setNewPropertyAddress(e.target.value)}
                className="h-11"
              />
            </div>
            {propertyError && <p className="text-sm text-red-600">{propertyError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddProperty(false)} className="flex-1 h-11">Cancel</Button>
              <Button type="submit" className="flex-1 h-11" disabled={addingProperty}>
                {addingProperty && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={!!editProperty} onOpenChange={(open) => { if (!open) setEditProperty(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>Update your property details.</DialogDescription>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="editPropName" className="text-sm font-medium text-slate-700 mb-1.5 block">Property Name</Label>
              <Input
                id="editPropName"
                value={editPropName}
                onChange={(e) => setEditPropName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="editPropAddr" className="text-sm font-medium text-slate-700 mb-1.5 block">Address</Label>
              <Input
                id="editPropAddr"
                value={editPropAddress}
                onChange={(e) => setEditPropAddress(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditProperty(null)} className="flex-1 h-11">Cancel</Button>
              <Button onClick={handleEditProperty} className="flex-1 h-11" disabled={savingProperty}>
                {savingProperty && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editUnit} onOpenChange={(open) => { if (!open) setEditUnit(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>Update unit name or rent amount.</DialogDescription>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="editUnitName" className="text-sm font-medium text-slate-700 mb-1.5 block">Unit Name</Label>
              <Input
                id="editUnitName"
                value={editUnitName}
                onChange={(e) => setEditUnitName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="editUnitRent" className="text-sm font-medium text-slate-700 mb-1.5 block">Monthly Rent</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">J$</span>
                <Input
                  id="editUnitRent"
                  type="number"
                  value={editUnitRent}
                  onChange={(e) => setEditUnitRent(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditUnit(null)} className="flex-1 h-11">Cancel</Button>
              <Button onClick={handleEditUnit} className="flex-1 h-11" disabled={savingUnit}>
                {savingUnit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Property Dialog */}
      <Dialog open={!!deletePropertyId} onOpenChange={(open) => { if (!open) setDeletePropertyId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete Property</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">This will permanently delete the property and all its units. Any tenant assignments will be removed.</p>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={() => setDeletePropertyId(null)} className="flex-1 h-11">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProperty} className="flex-1 h-11" disabled={deletingProperty}>
              {deletingProperty && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Dialog */}
      <Dialog open={!!deleteUnitId} onOpenChange={(open) => { if (!open) setDeleteUnitId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete Unit</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">This will permanently remove this unit from the property.</p>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={() => setDeleteUnitId(null)} className="flex-1 h-11">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUnit} className="flex-1 h-11" disabled={deletingUnit}>
              {deletingUnit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 py-16 text-center">
          <Home className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-sm font-medium text-slate-900">No properties yet</h3>
          <p className="text-sm text-slate-500 mt-1">Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((property) => {
            const units = property.units ?? [];
            const occupied = units.filter(u => occupancy.has(u.id)).length;
            const isExpanded = expandedProperty === property.id;
            const propertyRent = units.reduce((s, u) => s + u.rent_amount, 0);

            return (
              <Card key={property.id} className="overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Home className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{property.name}</h3>
                        {property.address && (
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditProperty(property);
                          setEditPropName(property.name);
                          setEditPropAddress(property.address ?? '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePropertyId(property.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        occupied === units.length && units.length > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : occupied > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Users className="h-3 w-3 inline mr-1" />
                        {occupied}/{units.length} occupied
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        J${propertyRent.toLocaleString()}/mo
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Units */}
                {isExpanded && (
                  <CardContent className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2">
                    {units.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">No units yet</p>
                    )}
                    {units.map((unit) => {
                      const tenant = occupancy.get(unit.id);
                      return (
                        <div key={unit.id} className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{unit.name}</p>
                            {tenant ? (
                              <p className="text-xs text-emerald-600">{tenant.tenant_name}</p>
                            ) : (
                              <p className="text-xs text-slate-400">Vacant</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">
                              J${unit.rent_amount.toLocaleString()}/mo
                            </span>
                            <button
                              onClick={() => {
                                setEditUnit(unit);
                                setEditUnitName(unit.name);
                                setEditUnitRent(String(unit.rent_amount));
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteUnitId(unit.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Unit Form */}
                    {unitError && showAddUnitFor === property.id && (
                      <p className="text-sm text-red-600 px-2">{unitError}</p>
                    )}
                    <form
                      onSubmit={(e) => handleAddUnit(e, property.id)}
                      className="bg-white p-2.5 rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Plus className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
                          <Input
                            required
                            placeholder="Unit name"
                            value={showAddUnitFor === property.id ? newUnitName : ''}
                            onFocus={() => { if (showAddUnitFor !== property.id) { setShowAddUnitFor(property.id); setNewUnitName(''); setNewUnitRent(''); } }}
                            onChange={(e) => { setShowAddUnitFor(property.id); setNewUnitName(e.target.value); }}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            required
                            placeholder="Rent (J$)"
                            value={showAddUnitFor === property.id ? newUnitRent : ''}
                            onFocus={() => { if (showAddUnitFor !== property.id) { setShowAddUnitFor(property.id); setNewUnitName(''); setNewUnitRent(''); } }}
                            onChange={(e) => { setShowAddUnitFor(property.id); setNewUnitRent(e.target.value); }}
                            className="h-9 text-sm flex-1"
                          />
                          <Button type="submit" size="sm" className="shrink-0 h-9 px-4" disabled={addingUnit}>
                            {addingUnit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
