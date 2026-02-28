import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { updateProfile, updateCompanyInfo, updateBankDetails, updateNotificationPreferences } from '@/services/profile';
import {
  updateProfileSchema,
  updateCompanyInfoSchema,
  updateBankDetailsSchema,
  createPropertySchema,
  createUnitSchema,
} from '@/schemas';
import { getProperties, createProperty, createUnit } from '@/services/properties';
import type { PropertyWithUnits } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Save, User, Building, Bell, CreditCard, Shield, Loader2, Check,
  Home, Plus, ChevronDown, ChevronRight, CheckCircle2, Mail, Eye, EyeOff, Landmark
} from 'lucide-react';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Profile form state
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  // Company form state
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '');
  const [companyAddress, setCompanyAddress] = useState(profile?.company_address ?? '');
  const [companyCity, setCompanyCity] = useState(profile?.company_city ?? '');
  const [companyCountry, setCompanyCountry] = useState(profile?.company_country ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(profile?.company_website ?? '');
  const [companyTaxId, setCompanyTaxId] = useState(profile?.company_tax_id ?? '');

  // Bank details form state
  const [bankName, setBankName] = useState(profile?.bank_name ?? '');
  const [bankAccountName, setBankAccountName] = useState(profile?.bank_account_name ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bank_account_number ?? '');
  const [bankBranch, setBankBranch] = useState(profile?.bank_branch ?? '');

  // Properties state
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  const [addingProperty, setAddingProperty] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  // Per-property unit form
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRent, setNewUnitRent] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [showAddUnitFor, setShowAddUnitFor] = useState<string | null>(null);

  // Notification preferences state
  const defaultPrefs = { payments: true, overdue: true, invoices: true, auto_remind: false };
  const [notifPrefs, setNotifPrefs] = useState(defaultPrefs);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savedNotifs, setSavedNotifs] = useState(false);

  // Security form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Billing "Get Notified" state
  const [proEmail, setProEmail] = useState('');
  const [proEmailSubmitted, setProEmailSubmitted] = useState(false);

  // Sync form fields when profile loads asynchronously
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? '');
    setLastName(profile.last_name ?? '');
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
    setCompanyName(profile.company_name ?? '');
    setCompanyAddress(profile.company_address ?? '');
    setCompanyCity(profile.company_city ?? '');
    setCompanyCountry(profile.company_country ?? '');
    setCompanyWebsite(profile.company_website ?? '');
    setCompanyTaxId(profile.company_tax_id ?? '');
    setBankName(profile.bank_name ?? '');
    setBankAccountName(profile.bank_account_name ?? '');
    setBankAccountNumber(profile.bank_account_number ?? '');
    setBankBranch(profile.bank_branch ?? '');
    const prefs = (profile as any)?.notification_preferences;
    if (prefs) setNotifPrefs(prefs);
  }, [profile]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'bank', label: 'Bank Details', icon: Landmark },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const loadProperties = async () => {
    if (!user) return;
    setPropertiesLoading(true);
    try {
      const data = await getProperties(user.id);
      setProperties(data);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'properties') {
      loadProperties();
    }
  }, [activeSection, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveError('');

    if (activeSection === 'profile') {
      const result = updateProfileSchema.safeParse({ firstName, lastName, email, phone });
      if (!result.success) { setSaveError(result.error.issues[0].message); return; }
    } else if (activeSection === 'company') {
      const result = updateCompanyInfoSchema.safeParse({ companyName, companyAddress, companyCity, companyCountry, companyWebsite, companyTaxId });
      if (!result.success) { setSaveError(result.error.issues[0].message); return; }
    } else if (activeSection === 'bank') {
      const result = updateBankDetailsSchema.safeParse({ bankName, bankAccountName, bankAccountNumber, bankBranch });
      if (!result.success) { setSaveError(result.error.issues[0].message); return; }
    }

    setSaving(true);
    setSaved(false);
    try {
      if (activeSection === 'profile') {
        await updateProfile(user.id, { first_name: firstName, last_name: lastName, email, phone });
      } else if (activeSection === 'company') {
        await updateCompanyInfo(user.id, {
          company_name: companyName,
          company_address: companyAddress,
          company_city: companyCity,
          company_country: companyCountry,
          company_website: companyWebsite,
          company_tax_id: companyTaxId,
        });
      } else if (activeSection === 'bank') {
        await updateBankDetails(user.id, {
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          bank_branch: bankBranch,
        });
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const [propertyError, setPropertyError] = useState('');

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
      await loadProperties();
    } catch (err) {
      console.error('Failed to add property:', err);
    } finally {
      setAddingProperty(false);
    }
  };

  const [unitError, setUnitError] = useState('');

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
      await loadProperties();
    } catch (err) {
      console.error('Failed to add unit:', err);
    } finally {
      setAddingUnit(false);
    }
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
        <p className="text-sm text-gray-500 mb-4">These details will be included in payment reminder emails sent to your tenants.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" placeholder="e.g. National Commercial Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input id="bankAccountName" placeholder="e.g. John Smith Properties" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <Input id="bankAccountNumber" placeholder="e.g. 1234567890" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bankBranch">Branch / Routing Number</Label>
            <Input id="bankBranch" placeholder="e.g. Half Way Tree" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesSection = () => (
    <div className="space-y-6">
      {/* Add Property Form */}
      {showAddProperty ? (
        <form onSubmit={handleAddProperty} className="p-5 border-2 border-blue-300 bg-white rounded-xl shadow-sm space-y-4">
          <h4 className="text-base font-semibold text-gray-900">Add New Property</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propName" className="text-sm font-medium text-gray-700">Property Name *</Label>
              <Input
                id="propName"
                required
                placeholder="e.g. Sunset Apartments"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="propAddr" className="text-sm font-medium text-gray-700">Address</Label>
              <Input
                id="propAddr"
                placeholder="e.g. 12 Harbour St, Kingston"
                value={newPropertyAddress}
                onChange={(e) => setNewPropertyAddress(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          {propertyError && <p className="text-sm text-red-600">{propertyError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" className="" disabled={addingProperty}>
              {addingProperty && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Property
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowAddProperty(false); setNewPropertyName(''); setNewPropertyAddress(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button className="w-full py-6 text-base" onClick={() => setShowAddProperty(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </Button>
      )}

      {/* Properties List */}
      {propertiesLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No properties yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first property above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const isExpanded = expandedProperty === property.id;
            const units = property.units ?? [];
            return (
              <div key={property.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Property Header */}
                <button
                  onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                  className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
                    isExpanded ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Home className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{property.name}</p>
                      {property.address && (
                        <p className="text-sm text-gray-500">{property.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {units.length} unit{units.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded: Units */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2">
                    {units.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                        <p className="text-sm font-bold text-blue-600">
                          J${unit.rent_amount.toLocaleString()}/mo
                        </p>
                      </div>
                    ))}

                    {unitError && showAddUnitFor === property.id && <p className="text-sm text-red-600 px-2">{unitError}</p>}
                    <form
                      onSubmit={(e) => handleAddUnit(e, property.id)}
                      className="bg-white p-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Plus className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
                          <Input
                            required
                            placeholder="Unit name"
                            value={showAddUnitFor === property.id ? newUnitName : ''}
                            onFocus={() => { if (showAddUnitFor !== property.id) { setShowAddUnitFor(property.id); setNewUnitName(''); setNewUnitRent(''); } }}
                            onChange={(e) => { setShowAddUnitFor(property.id); setNewUnitName(e.target.value); }}
                            className="h-9 border-gray-300 text-sm"
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
                            className="h-9 border-gray-300 text-sm flex-1"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="shrink-0 h-9 px-4"
                            disabled={addingUnit}
                          >
                            {addingUnit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const handleSaveNotifs = async () => {
    if (!user) return;
    setSavingNotifs(true);
    setSavedNotifs(false);
    try {
      await updateNotificationPreferences(user.id, notifPrefs);
      await refreshProfile();
      setSavedNotifs(true);
      setTimeout(() => setSavedNotifs(false), 2000);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
    } finally {
      setSavingNotifs(false);
    }
  };

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { id: 'payments' as const, label: 'Payment Received', description: 'Get notified when tenants make payments' },
            { id: 'overdue' as const, label: 'Overdue Payments', description: 'Get alerts for overdue rent payments' },
            { id: 'invoices' as const, label: 'Invoice Sent', description: 'Confirmation when invoices are sent to tenants' },
            { id: 'auto_remind' as const, label: 'Automatic Reminders', description: 'Automatically email tenants daily when their invoices are overdue' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl transition-colors hover:bg-gray-50/50">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <Switch
                checked={notifPrefs[item.id]}
                onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, [item.id]: checked })}
              />
            </div>
          ))}
        </div>
        <div className="pt-4">
          <Button className="" onClick={handleSaveNotifs} disabled={savingNotifs}>
            {savingNotifs ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : savedNotifs ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {savedNotifs ? 'Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="font-medium text-gray-900">Free Plan</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">J$0<span className="text-sm font-normal">/month</span></p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              Up to 10 properties
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              Email reminders
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              CSV export
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="font-medium text-gray-900">Pro Plan &mdash; Coming Soon</p>
          <p className="text-sm text-gray-500 mt-1">Unlimited properties, custom branding, priority support</p>
          {proEmailSubmitted ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
              <Check className="h-4 w-4" />
              We'll notify you when Pro is available!
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={proEmail}
                onChange={(e) => setProEmail(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (proEmail.trim()) setProEmailSubmitted(true);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Get Notified
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSavedPassword(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSavedPassword(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                placeholder="Min 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                placeholder="Re-enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
          {savedPassword && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" /> Password updated successfully.
            </p>
          )}
          <Button type="submit" className="" disabled={savingPassword}>
            {savingPassword ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'company': return renderCompanySection();
      case 'bank': return renderBankSection();
      case 'properties': return renderPropertiesSection();
      case 'notifications': return renderNotificationsSection();
      case 'billing': return renderBillingSection();
      case 'security': return renderSecuritySection();
      default: return renderProfileSection();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {(activeSection === 'profile' || activeSection === 'company' || activeSection === 'bank') && (
          <div className="flex items-center gap-3">
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <Button className="" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{sections.find(s => s.id === activeSection)?.label}</CardTitle>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
