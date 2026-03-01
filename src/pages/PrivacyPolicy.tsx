import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6 block" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-slate-400">Last updated: February 28, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">1. Information We Collect</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When you create an account, we collect your name, email address, and password. If you are a landlord, we also collect company information, bank details (for display on tenant invoices), and property/unit data. If you are a tenant, we collect your contact information and payment proof uploads.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We automatically collect usage data such as pages visited, features used, and device information to improve our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">2. How We Use Your Information</h2>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc list-inside">
              <li>To provide and maintain the EasyCollect service</li>
              <li>To process and track rent payments and invoices</li>
              <li>To send email notifications and payment reminders</li>
              <li>To display landlord bank details on tenant payment pages</li>
              <li>To provide customer support</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To improve our service based on usage patterns</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">3. Data Storage & Security</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your data is stored securely using Supabase, which provides encryption at rest and in transit. Passwords are hashed and never stored in plain text. Payment proof images are stored in secure cloud storage with access controls.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We do not process actual financial transactions. EasyCollect is a payment tracking and verification platform — tenants submit proof of payment (e.g., bank transfer screenshots) which landlords verify manually.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">4. Information Sharing</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share data with:
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Service providers:</strong> Supabase (database/auth), Resend (email delivery), Sentry (error monitoring)</li>
              <li><strong>Between landlord and tenant:</strong> Landlord bank details are shown to tenants on payment pages. Tenant names and payment info are shown to their landlord.</li>
              <li><strong>Legal requirements:</strong> If required by law, regulation, or legal process</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">5. Your Rights</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You have the right to access, update, or delete your personal information at any time through your account settings. You can request a full export or deletion of your data by contacting us. You may opt out of non-essential email notifications in your notification settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">6. Cookies & Local Storage</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We use browser local storage to maintain your login session, remember UI preferences (such as dismissed setup guides), and track daily AI chat usage limits. We do not use third-party tracking cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">7. Changes to This Policy</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">8. Contact</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have any questions about this privacy policy, please contact us at <a href="mailto:support@easycollect.app" className="text-blue-600 hover:underline">support@easycollect.app</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
