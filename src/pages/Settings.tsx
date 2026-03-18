import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { updateProfile, updateCompanyInfo, updateBankDetails, updateNotificationPreferences } from '@/services/profile';
import {
  updateProfileSchema,
  updateCompanyInfoSchema,
  updateBankDetailsSchema,
  lateFeeSettingsSchema,
  recurringInvoiceSettingsSchema,
} from '@/schemas';
import { getLateFeeSettings, upsertLateFeeSettings } from '@/services/lateFees';
import { seedTestNotifications } from '@/utils/seedNotifications';
import { getRecurringInvoiceSettings, upsertRecurringInvoiceSettings } from '@/services/recurringInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Save, User, Building, Bell, CreditCard, Shield, Loader2, Check,
  Home, CheckCircle2, Mail, Eye, EyeOff, Landmark, Clock, Wallet, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Select } from '@/components/ui/select';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    const section = searchParams.get('section');
    return section && ['profile', 'company', 'bank', 'payment', 'properties', 'notifications', 'late-fees', 'recurring', 'billing', 'security'].includes(section)
      ? section
      : 'profile';
  });
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

  // Payment gateway — HandyPay API key is stored server-side

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

  // Late fee settings state
  const [lfFeeType, setLfFeeType] = useState<'flat' | 'percentage'>('flat');
  const [lfFeeValue, setLfFeeValue] = useState('');
  const [lfGraceDays, setLfGraceDays] = useState('0');
  const [lfAutoApply, setLfAutoApply] = useState(false);
  const [savingLateFees, setSavingLateFees] = useState(false);
  const [savedLateFees, setSavedLateFees] = useState(false);
  const [lateFeesLoading, setLateFeesLoading] = useState(false);
  const [lateFeeError, setLateFeeError] = useState('');

  // Recurring invoice settings state
  const [riEnabled, setRiEnabled] = useState(false);
  const [riDayOfMonth, setRiDayOfMonth] = useState('1');
  const [riSendEmails, setRiSendEmails] = useState(true);
  const [riDescTemplate, setRiDescTemplate] = useState('Monthly Rent — {month} {year}');
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [savedRecurring, setSavedRecurring] = useState(false);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringError, setRecurringError] = useState('');

  // Seed notifications state
  const [seeding, setSeeding] = useState(false);

  // Billing "Get Notified" state
  const [proEmail, setProEmail] = useState('');
  const [proEmailSubmitted, setProEmailSubmitted] = useState(false);

  const { toast } = useToast();

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
    // payment_link no longer used (HandyPay API key is server-side)
    const prefs = (profile as any)?.notification_preferences;
    if (prefs) setNotifPrefs(prefs);
  }, [profile]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'bank', label: 'Bank Details', icon: Landmark },
    { id: 'payment', label: 'Payment Gateway', icon: Wallet },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'late-fees', label: 'Late Fees', icon: Clock },
    { id: 'recurring', label: 'Recurring Invoices', icon: RefreshCw },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const loadLateFeeSettings = async () => {
    if (!user) return;
    setLateFeesLoading(true);
    try {
      const settings = await getLateFeeSettings(user.id);
      if (settings) {
        setLfFeeType(settings.fee_type);
        setLfFeeValue(String(settings.fee_value));
        setLfGraceDays(String(settings.grace_period_days));
        setLfAutoApply(settings.auto_apply);
      }
    } catch (err) {
      console.error('Failed to load late fee settings:', err);
    } finally {
      setLateFeesLoading(false);
    }
  };

  const loadRecurringSettings = async () => {
    if (!user) return;
    setRecurringLoading(true);
    try {
      const settings = await getRecurringInvoiceSettings(user.id);
      if (settings) {
        setRiEnabled(settings.enabled);
        setRiDayOfMonth(String(settings.day_of_month));
        setRiSendEmails(settings.send_emails);
        setRiDescTemplate(settings.description_template);
      }
    } catch (err) {
      console.error('Failed to load recurring invoice settings:', err);
    } finally {
      setRecurringLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'late-fees') {
      loadLateFeeSettings();
    } else if (activeSection === 'recurring') {
      loadRecurringSettings();
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

  const renderPaymentGatewaySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Payment Gateway</h3>
        <p className="text-sm text-gray-500 mb-4">
          Accept online payments from tenants via HandyPay. When tenants view their invoices, they'll see a "Pay Online" button with the exact amount pre-filled.
        </p>
        <div className="p-4 border rounded-lg bg-green-50 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">HandyPay Connected</p>
            <p className="text-sm text-green-700">Online payments are enabled for all invoices.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesSection = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Properties are now managed on a dedicated page with full CRUD, occupancy tracking, and more.
      </p>
      <Link to="/properties">
        <Button className="w-full py-6 text-base">
          <Home className="h-5 w-5 mr-2" />
          Go to Properties
        </Button>
      </Link>
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
        <div className="pt-4 flex gap-3">
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
          <Button
            variant="outline"
            disabled={seeding}
            onClick={async () => {
              if (!user) return;
              setSeeding(true);
              try {
                const count = await seedTestNotifications(user.id);
                toast(`${count} test notifications created!`, 'success');
              } catch (err) {
                console.error('Failed to seed notifications:', err);
                toast('Failed to seed notifications.', 'error');
              } finally {
                setSeeding(false);
              }
            }}
          >
            {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
            Seed Test Notifications
          </Button>
        </div>
      </div>
    </div>
  );

  const handleSaveLateFees = async () => {
    if (!user) return;
    setLateFeeError('');

    const result = lateFeeSettingsSchema.safeParse({
      feeType: lfFeeType,
      feeValue: lfFeeValue,
      gracePeriodDays: lfGraceDays,
      autoApply: lfAutoApply,
    });
    if (!result.success) {
      setLateFeeError(result.error.issues[0].message);
      return;
    }

    setSavingLateFees(true);
    setSavedLateFees(false);
    try {
      await upsertLateFeeSettings(user.id, {
        fee_type: lfFeeType,
        fee_value: Number(lfFeeValue),
        grace_period_days: Number(lfGraceDays),
        auto_apply: lfAutoApply,
      });
      setSavedLateFees(true);
      toast('Late fee settings saved!', 'success');
      setTimeout(() => setSavedLateFees(false), 2000);
    } catch (err) {
      console.error('Failed to save late fee settings:', err);
      toast('Failed to save late fee settings.', 'error');
    } finally {
      setSavingLateFees(false);
    }
  };

  const renderLateFeesSection = () => {
    if (lateFeesLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Late Fee Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure automatic late fees for overdue invoices. Fees are applied once per invoice after the grace period.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lf-type">Fee Type</Label>
              <Select
                id="lf-type"
                value={lfFeeType}
                onValueChange={(val) => setLfFeeType(val as 'flat' | 'percentage')}
                className="mt-1"
                options={[
                  { value: 'flat', label: 'Flat Amount (J$)' },
                  { value: 'percentage', label: 'Percentage (%)' },
                ]}
              />
            </div>
            <div>
              <Label htmlFor="lf-value">
                {lfFeeType === 'flat' ? 'Fee Amount (J$)' : 'Fee Percentage (%)'}
              </Label>
              <Input
                id="lf-value"
                type="number"
                min="0"
                step={lfFeeType === 'percentage' ? '0.1' : '1'}
                value={lfFeeValue}
                onChange={(e) => setLfFeeValue(e.target.value)}
                placeholder={lfFeeType === 'flat' ? 'e.g. 2000' : 'e.g. 5'}
              />
            </div>
            <div>
              <Label htmlFor="lf-grace">Grace Period (days)</Label>
              <Input
                id="lf-grace"
                type="number"
                min="0"
                value={lfGraceDays}
                onChange={(e) => setLfGraceDays(e.target.value)}
                placeholder="e.g. 3"
              />
              <p className="text-xs text-gray-400 mt-1">Days after due date before late fee applies</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-4 border border-gray-200 rounded-xl transition-colors hover:bg-gray-50/50">
            <div>
              <p className="font-medium text-gray-900">Auto-Apply Late Fees</p>
              <p className="text-sm text-gray-500">Automatically apply late fees to overdue invoices daily</p>
            </div>
            <Switch
              checked={lfAutoApply}
              onCheckedChange={setLfAutoApply}
            />
          </div>

          {lateFeeError && <p className="text-sm text-red-600 mt-2">{lateFeeError}</p>}

          <div className="pt-4">
            <Button onClick={handleSaveLateFees} disabled={savingLateFees}>
              {savingLateFees ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : savedLateFees ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savedLateFees ? 'Saved!' : 'Save Late Fee Settings'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveRecurring = async () => {
    if (!user) return;
    setRecurringError('');

    const result = recurringInvoiceSettingsSchema.safeParse({
      enabled: riEnabled,
      dayOfMonth: riDayOfMonth,
      sendEmails: riSendEmails,
      descriptionTemplate: riDescTemplate,
    });
    if (!result.success) {
      setRecurringError(result.error.issues[0].message);
      return;
    }

    setSavingRecurring(true);
    setSavedRecurring(false);
    try {
      await upsertRecurringInvoiceSettings(user.id, {
        enabled: riEnabled,
        day_of_month: Number(riDayOfMonth),
        send_emails: riSendEmails,
        description_template: riDescTemplate,
      });
      setSavedRecurring(true);
      toast('Recurring invoice settings saved!', 'success');
      setTimeout(() => setSavedRecurring(false), 2000);
    } catch (err) {
      console.error('Failed to save recurring invoice settings:', err);
      toast('Failed to save recurring invoice settings.', 'error');
    } finally {
      setSavingRecurring(false);
    }
  };

  const renderRecurringSection = () => {
    if (recurringLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Recurring Invoice Automation</h3>
          <p className="text-sm text-gray-500 mb-4">
            Automatically generate invoices for all active tenants on a specific day each month, using each tenant's unit rent amount.
          </p>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl transition-colors hover:bg-gray-50/50 mb-4">
            <div>
              <p className="font-medium text-gray-900">Enable Auto-Generation</p>
              <p className="text-sm text-gray-500">Invoices will be created automatically each month</p>
            </div>
            <Switch
              checked={riEnabled}
              onCheckedChange={setRiEnabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ri-day">Day of Month</Label>
              <Input
                id="ri-day"
                type="number"
                min="1"
                max="28"
                value={riDayOfMonth}
                onChange={(e) => setRiDayOfMonth(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Invoices are generated on this day (1–28)</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-4 border border-gray-200 rounded-xl transition-colors hover:bg-gray-50/50">
            <div>
              <p className="font-medium text-gray-900">Send Invoice Emails</p>
              <p className="text-sm text-gray-500">Email tenants when invoices are auto-generated</p>
            </div>
            <Switch
              checked={riSendEmails}
              onCheckedChange={setRiSendEmails}
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="ri-desc">Description Template</Label>
            <Input
              id="ri-desc"
              value={riDescTemplate}
              onChange={(e) => setRiDescTemplate(e.target.value)}
              placeholder="Monthly Rent — {month} {year}"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">{'{month}'}</code> and <code className="bg-gray-100 px-1 rounded">{'{year}'}</code> as placeholders
            </p>
          </div>

          {recurringError && <p className="text-sm text-red-600 mt-2">{recurringError}</p>}

          <div className="pt-4">
            <Button onClick={handleSaveRecurring} disabled={savingRecurring}>
              {savingRecurring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : savedRecurring ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savedRecurring ? 'Saved!' : 'Save Recurring Settings'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
      case 'payment': return renderPaymentGatewaySection();
      case 'properties': return renderPropertiesSection();
      case 'notifications': return renderNotificationsSection();
      case 'late-fees': return renderLateFeesSection();
      case 'recurring': return renderRecurringSection();
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
          <nav className="bg-white rounded-2xl border border-slate-200/60 p-3 space-y-1">
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
