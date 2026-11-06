import { useState, useEffect, useRef } from 'react';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type SectionId = 'profile' | 'company' | 'bank' | 'payment' | 'properties' | 'notifications' | 'late-fees' | 'recurring' | 'billing' | 'security';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Business' },
  { id: 'bank', label: 'Bank details' },
  { id: 'payment', label: 'Online payments' },
  { id: 'properties', label: 'Properties and units' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'late-fees', label: 'Late fees' },
  { id: 'recurring', label: 'Recurring invoices' },
  { id: 'billing', label: 'Plan' },
  { id: 'security', label: 'Password' },
];

const isSection = (s: string | null): s is SectionId => !!s && SECTIONS.some((x) => x.id === s);

const fieldClass = 'mt-1.5';
const selectClass =
  'mt-1.5 h-10 w-full cursor-pointer rounded-[3px] border border-input bg-transparent px-3 text-sm text-ink hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid';

function Field({ id, label, hint, className, children }: { id: string; label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[13.5px] text-quiet">{hint}</p>}
    </div>
  );
}

/** A yes or no preference: a checkbox, its name and one line on what it does. */
function Preference({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 border-t border-rule py-3.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        <span className="block text-[13.5px] text-quiet">{description}</span>
      </label>
    </div>
  );
}

/** One Save per section, with the result said in words beside it. */
function SaveRow({ label, onClick, saving, saved, error, type = 'button' }: { label: string; onClick?: () => void; saving: boolean; saved: boolean; error?: string; type?: 'button' | 'submit' }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-5">
      <Button type={type} onClick={onClick} disabled={saving} className="max-sm:h-12 max-sm:w-full max-sm:text-base">
        {saving ? 'Saving' : label}
      </Button>
      <p role="status" aria-live="polite" className="text-sm">
        {error ? <span className="font-medium text-late">{error}</span> : saved ? <span className="font-medium text-paid">Saved.</span> : null}
      </p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-xl text-[15px] text-quiet">{description}</p>}
    </div>
  );
}

const SAVE_FAILED = 'Could not save. Check your connection and try again.';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const section = searchParams.get('section');
    return isSection(section) ? section : 'profile';
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

  // Payment gateway: the HandyPay API key is stored server side

  // Notification preferences state
  const defaultPrefs = { payments: true, overdue: true, invoices: true, auto_remind: false };
  const [notifPrefs, setNotifPrefs] = useState(defaultPrefs);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savedNotifs, setSavedNotifs] = useState(false);
  const [notifError, setNotifError] = useState('');

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
  const [riDescTemplate, setRiDescTemplate] = useState('Rent for {month} {year}');
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [savedRecurring, setSavedRecurring] = useState(false);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringError, setRecurringError] = useState('');

  // Seed notifications state
  const [seeding, setSeeding] = useState(false);

  const { toast } = useToast();

  // Follow ?section= when it changes, for example from a link on another page
  useEffect(() => {
    const section = searchParams.get('section');
    if (isSection(section)) setActiveSection(section);
  }, [searchParams]);

  // Keep the current tab in view on phones, where the tabs scroll sideways
  const phoneTabsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = phoneTabsRef.current;
    const tab = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && tab) nav.scrollLeft = tab.offsetLeft - nav.clientWidth / 2 + tab.offsetWidth / 2;
  }, [activeSection]);

  const openSection = (id: SectionId) => {
    setActiveSection(id);
    setSaved(false);
    setSaveError('');
    setSearchParams({ section: id }, { replace: true });
  };

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
    if (prefs) setNotifPrefs({ ...defaultPrefs, ...prefs });
  }, [profile]);

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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const renderProfileSection = () => (
    <>
      <SectionTitle title="Profile" description="Your name and how tenants and borrowers can reach you." />
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field id="firstName" label="First name">
          <Input id="firstName" autoComplete="given-name" className={fieldClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field id="lastName" label="Last name">
          <Input id="lastName" autoComplete="family-name" className={fieldClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="phone" label="Phone">
          <Input id="phone" type="tel" autoComplete="tel" className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <SaveRow label="Save profile" onClick={handleSave} saving={saving} saved={saved} error={saveError} />
    </>
  );

  const renderCompanySection = () => (
    <>
      <SectionTitle title="Business" description="Shown on invoices and receipts. Leave it blank if you collect under your own name." />
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field id="companyName" label="Business name" className="sm:col-span-2">
          <Input id="companyName" autoComplete="organization" className={fieldClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </Field>
        <Field id="address" label="Address" className="sm:col-span-2">
          <Input id="address" autoComplete="street-address" className={fieldClass} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </Field>
        <Field id="city" label="Town or city">
          <Input id="city" className={fieldClass} value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} />
        </Field>
        <Field id="country" label="Country">
          <Input id="country" autoComplete="country-name" className={fieldClass} value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} />
        </Field>
        <Field id="website" label="Website">
          <Input id="website" type="url" className={fieldClass} value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
        </Field>
        <Field id="taxId" label="TRN or tax ID">
          <Input id="taxId" className={fieldClass} value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} />
        </Field>
      </div>
      <SaveRow label="Save business details" onClick={handleSave} saving={saving} saved={saved} error={saveError} />
    </>
  );

  const renderBankSection = () => (
    <>
      <SectionTitle title="Bank details" description="Tenants see these on their pay link and in reminder emails, so they know where to send money." />
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field id="bankName" label="Bank" className="sm:col-span-2">
          <Input id="bankName" placeholder="National Commercial Bank" className={fieldClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </Field>
        <Field id="bankAccountName" label="Name on the account">
          <Input id="bankAccountName" className={fieldClass} value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
        </Field>
        <Field id="bankAccountNumber" label="Account number">
          <Input id="bankAccountNumber" inputMode="numeric" className={cn(fieldClass, 'num')} value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
        </Field>
        <Field id="bankBranch" label="Branch">
          <Input id="bankBranch" placeholder="Half Way Tree" className={fieldClass} value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
        </Field>
      </div>
      <SaveRow label="Save bank details" onClick={handleSave} saving={saving} saved={saved} error={saveError} />
    </>
  );

  const renderPaymentGatewaySection = () => (
    <>
      <SectionTitle title="Online payments" description="Tenants can pay by card through HandyPay from their pay link. The amount is filled in for them." />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-rule py-3.5">
        <span className="text-[15px] font-medium">HandyPay</span>
        <StatusBadge variant="paid">On for every invoice</StatusBadge>
      </div>
      <p className="border-t border-rule pt-3.5 text-[13.5px] text-quiet">
        Bank transfer stays the main way to pay. Card payments are an extra option for tenants who prefer it.
      </p>
    </>
  );

  const renderPropertiesSection = () => (
    <>
      <SectionTitle title="Properties and units" description="Add, rename or remove properties and their units on the Properties page. Each unit holds its rent amount." />
      <Link to="/properties" className={buttonVariants({ className: 'max-sm:h-12 max-sm:w-full max-sm:text-base' })}>Open properties</Link>
    </>
  );

  const handleSaveNotifs = async () => {
    if (!user) return;
    setSavingNotifs(true);
    setSavedNotifs(false);
    setNotifError('');
    try {
      await updateNotificationPreferences(user.id, notifPrefs);
      await refreshProfile();
      setSavedNotifs(true);
      setTimeout(() => setSavedNotifs(false), 3000);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setNotifError(SAVE_FAILED);
    } finally {
      setSavingNotifs(false);
    }
  };

  const renderNotificationsSection = () => (
    <>
      <SectionTitle title="Notifications" description="Choose which emails you get, and whether late tenants are reminded for you." />
      <h3 className="pb-1 text-[15px] font-semibold">Reminders to tenants</h3>
      <Preference
        id="pref-auto_remind"
        label="Send reminders automatically"
        description="Late tenants get an email each day until they pay. It includes the amount, your bank details and a pay link."
        checked={notifPrefs.auto_remind}
        onChange={(v) => setNotifPrefs({ ...notifPrefs, auto_remind: v })}
      />
      <h3 className="mt-6 pb-1 text-[15px] font-semibold">Emails to you</h3>
      {[
        { id: 'payments' as const, label: 'A payment comes in', description: 'When a tenant pays or sends proof of payment.' },
        { id: 'overdue' as const, label: 'Rent goes late', description: 'When an invoice passes its due date.' },
        { id: 'invoices' as const, label: 'An invoice is sent', description: 'A copy each time an invoice goes to a tenant.' },
      ].map((item) => (
        <Preference
          key={item.id}
          id={`pref-${item.id}`}
          label={item.label}
          description={item.description}
          checked={notifPrefs[item.id]}
          onChange={(v) => setNotifPrefs({ ...notifPrefs, [item.id]: v })}
        />
      ))}
      <SaveRow label="Save notifications" onClick={handleSaveNotifs} saving={savingNotifs} saved={savedNotifs} error={notifError} />
      <button
        type="button"
        disabled={seeding}
        className="mt-6 min-h-11 cursor-pointer text-sm text-quiet underline hover:text-ink disabled:opacity-50"
        onClick={async () => {
          if (!user) return;
          setSeeding(true);
          try {
            const count = await seedTestNotifications(user.id);
            toast(`${count} test notifications added.`, 'success');
          } catch (err) {
            console.error('Failed to seed notifications:', err);
            toast('Could not add test notifications.', 'error');
          } finally {
            setSeeding(false);
          }
        }}
      >
        {seeding ? 'Adding test notifications' : 'Add test notifications'}
      </button>
    </>
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
      setTimeout(() => setSavedLateFees(false), 3000);
    } catch (err) {
      console.error('Failed to save late fee settings:', err);
      setLateFeeError(SAVE_FAILED);
    } finally {
      setSavingLateFees(false);
    }
  };

  const loadingFields = (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-10 w-full max-w-md" />
    </div>
  );

  const renderLateFeesSection = () => {
    if (lateFeesLoading) return loadingFields;

    return (
      <>
        <SectionTitle title="Late fees" description="A late fee is added once to an invoice after the grace period ends." />
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field id="lf-type" label="Fee type">
            <select id="lf-type" className={selectClass} value={lfFeeType} onChange={(e) => setLfFeeType(e.target.value as 'flat' | 'percentage')}>
              <option value="flat">Fixed amount in J$</option>
              <option value="percentage">Percent of the invoice</option>
            </select>
          </Field>
          <Field id="lf-value" label={lfFeeType === 'flat' ? 'Amount in J$' : 'Percent'}>
            <Input
              id="lf-value"
              type="number"
              inputMode="decimal"
              min="0"
              step={lfFeeType === 'percentage' ? '0.1' : '1'}
              className={cn(fieldClass, 'num')}
              value={lfFeeValue}
              onChange={(e) => setLfFeeValue(e.target.value)}
              placeholder={lfFeeType === 'flat' ? '2000' : '5'}
            />
          </Field>
          <Field id="lf-grace" label="Grace period in days" hint="Days after the due date before the fee is added.">
            <Input
              id="lf-grace"
              type="number"
              inputMode="numeric"
              min="0"
              className={cn(fieldClass, 'num')}
              value={lfGraceDays}
              onChange={(e) => setLfGraceDays(e.target.value)}
              placeholder="3"
            />
          </Field>
        </div>
        <div className="mt-6">
          <Preference
            id="lf-auto"
            label="Add late fees automatically"
            description="Each day, late invoices past the grace period get the fee added."
            checked={lfAutoApply}
            onChange={setLfAutoApply}
          />
        </div>
        <SaveRow label="Save late fees" onClick={handleSaveLateFees} saving={savingLateFees} saved={savedLateFees} error={lateFeeError} />
      </>
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
      setTimeout(() => setSavedRecurring(false), 3000);
    } catch (err: any) {
      console.error('Failed to save recurring invoice settings:', err);
      setRecurringError(err?.message ?? SAVE_FAILED);
    } finally {
      setSavingRecurring(false);
    }
  };

  const renderRecurringSection = () => {
    if (recurringLoading) return loadingFields;

    return (
      <>
        <SectionTitle title="Recurring invoices" description="Create an invoice for every active tenant on the same day each month, using the rent set on their unit." />
        <Preference
          id="ri-enabled"
          label="Create invoices each month"
          description="Invoices are made for you on the day below."
          checked={riEnabled}
          onChange={setRiEnabled}
        />
        <Preference
          id="ri-emails"
          label="Email each invoice to the tenant"
          description="The tenant gets the invoice with a pay link as soon as it is made."
          checked={riSendEmails}
          onChange={setRiSendEmails}
        />
        <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field id="ri-day" label="Day of the month" hint="Any day from 1 to 28, so it works in every month.">
            <Input
              id="ri-day"
              type="number"
              inputMode="numeric"
              min="1"
              max="28"
              className={cn(fieldClass, 'num')}
              value={riDayOfMonth}
              onChange={(e) => setRiDayOfMonth(e.target.value)}
            />
          </Field>
          <Field
            id="ri-desc"
            label="Invoice description"
            className="sm:col-span-2"
            hint="Write {month} and {year} where the month and year should go."
          >
            <Input
              id="ri-desc"
              className={fieldClass}
              value={riDescTemplate}
              onChange={(e) => setRiDescTemplate(e.target.value)}
              placeholder="Rent for {month} {year}"
            />
          </Field>
        </div>
        <SaveRow label="Save recurring invoices" onClick={handleSaveRecurring} saving={savingRecurring} saved={savedRecurring} error={recurringError} />
      </>
    );
  };

  const renderBillingSection = () => (
    <>
      <SectionTitle title="Plan" />
      <div className="border-t border-rule py-4">
        <p className="text-lg font-semibold">EasyCollect is free for now.</p>
        <p className="mt-1 max-w-xl text-[15px] text-quiet">Everything in the app is included. There is nothing to pay and no card on file.</p>
      </div>
      <div className="border-t border-rule py-4">
        <p className="text-[15px] font-semibold">A Pro plan is coming</p>
        <p className="mt-1 max-w-xl text-[15px] text-quiet">It does not have a price yet. You do not need to do anything now.</p>
      </div>
    </>
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The two passwords do not match.');
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
      setPasswordError(err.message || 'Could not change your password. Try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const passwordField = (id: string, label: string, value: string, set: (v: string) => void, shown: boolean, toggle: () => void, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <Field id={id} label={label}>
      <div className="relative mt-1.5">
        <Input
          id={id}
          type={shown ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => { set(e.target.value); setPasswordError(''); }}
          className="pr-16"
          {...extra}
        />
        <button
          type="button"
          onClick={toggle}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 min-w-14 cursor-pointer px-3 text-sm text-quiet underline hover:text-ink"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </Field>
  );

  const renderSecuritySection = () => (
    <>
      <SectionTitle title="Password" description="Choose a new password for signing in. Use at least 6 characters." />
      <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
        {passwordField('newPassword', 'New password', newPassword, setNewPassword, showNewPassword, () => setShowNewPassword(!showNewPassword), { minLength: 6, autoComplete: 'new-password' })}
        {passwordField('confirmPassword', 'Type it again', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), { autoComplete: 'new-password' })}
        <SaveRow type="submit" label="Change password" saving={savingPassword} saved={savedPassword} error={passwordError} />
      </form>
    </>
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
    <>
      <PageHeader title="Settings" />

      {/* Phones: sections as underline tabs */}
      <nav ref={phoneTabsRef} aria-label="Settings sections" className="relative -mx-4 mb-6 flex gap-5 overflow-x-auto border-b border-rule px-4 sm:-mx-8 sm:px-8 lg:hidden">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openSection(s.id)}
            aria-current={activeSection === s.id ? 'page' : undefined}
            className={cn(
              '-mb-px min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 text-sm',
              activeSection === s.id ? 'border-ink font-semibold text-ink' : 'border-transparent text-quiet hover:text-ink'
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-11">
        {/* Desktop: a plain list marked like the rail */}
        <nav aria-label="Settings sections" className="hidden self-start border-t border-rule pt-2 lg:block">
          {SECTIONS.map((s) => {
            const on = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => openSection(s.id)}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'block w-full cursor-pointer py-2 pl-4 pr-2 text-left text-[15px] transition-colors duration-100',
                  on ? 'font-semibold text-ink shadow-[inset_3px_0_0_var(--color-marker)]' : 'text-quiet hover:text-ink'
                )}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <section className="min-w-0 max-w-[680px] lg:border-t lg:border-rule lg:pt-5">{renderContent()}</section>
      </div>
    </>
  );
}
