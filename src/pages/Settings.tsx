import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <AppLayout>
      <PageHeader title="Settings" />

      <div className="space-y-6 max-w-2xl">
        {/* Property Details */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Property Details</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input id="propertyName" defaultValue="The Pods" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue="6 University Dr, Kingston" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landlordName">Landlord / Business Name</Label>
              <Input id="landlordName" defaultValue="The Pods Property Management" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue="876-784-8380" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="info@thepods.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Property Description</Label>
              <textarea 
                id="description" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="Spacious Apartments - Unfurnished apt at 6 University Dr—near unis & amenities. Private bath & kitchen. Rent: $50,000/mo (light + water incl.)."
              />
            </div>
            <Button size="sm">Save</Button>
          </div>
        </section>

        {/* Bank Account / Payouts */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Bank Account / Payouts</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-success font-medium">Connected</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p>Bank: National Commercial Bank</p>
            <p>Account: ****4521</p>
            <p>Payout Schedule: Weekly</p>
          </div>
          <Button variant="outline" size="sm">Manage in Stripe</Button>
        </section>

        {/* Notifications */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailInvoices" className="font-normal cursor-pointer">
                Email invoices to tenants
              </Label>
              <Switch id="emailInvoices" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailConfirmTenants" className="font-normal cursor-pointer">
                Email payment confirmations to tenants
              </Label>
              <Switch id="emailConfirmTenants" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailConfirmMe" className="font-normal cursor-pointer">
                Email payment confirmations to me
              </Label>
              <Switch id="emailConfirmMe" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="smsReminders" className="font-normal cursor-pointer">
                SMS reminders for overdue payments
              </Label>
              <Switch id="smsReminders" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weeklySummary" className="font-normal cursor-pointer">
                Email me a weekly collection summary
              </Label>
              <Switch id="weeklySummary" />
            </div>
            <Button size="sm">Save</Button>
          </div>
        </section>

        {/* Invoice Defaults */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Invoice Defaults</h2>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              Standard rent: J$50,000/month (includes light & water)
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDay">Due day of month</Label>
                <Input id="dueDay" type="number" min="1" max="28" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace period (days)</Label>
                <Input id="gracePeriod" type="number" min="0" defaultValue="3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lateFee">Late fee amount (JMD)</Label>
              <Input id="lateFee" type="number" min="0" defaultValue="5000" />
            </div>
            <Button size="sm">Save</Button>
          </div>
        </section>

        {/* Account */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">management@thepods.com</p>
                <p className="text-xs text-muted-foreground">Email address</p>
              </div>
              <button className="text-sm text-primary hover:underline">Change</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">••••••••</p>
                <p className="text-xs text-muted-foreground">Password</p>
              </div>
              <button className="text-sm text-primary hover:underline">Change Password</button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <button className="text-sm text-destructive hover:underline">Delete Account</button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
