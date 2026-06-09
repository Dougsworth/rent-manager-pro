import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="Privacy Policy"
        description="EasyCollect privacy policy — how we collect, use, and protect your data. Your privacy matters."
        path="/privacy"
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="text-lg font-extrabold tracking-tight text-slate-900" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 sm:p-12 space-y-10">
            <div className="border-b border-slate-100 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Privacy Policy</h1>
              <p className="text-sm text-slate-400">Last updated: June 4, 2026</p>
            </div>

            <section className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                This policy explains how EasyCollect collects, uses, and protects personal
                data. We are committed to handling your data in accordance with Jamaica's{' '}
                <strong>Data Protection Act, 2020 (the "JDPA")</strong>, which is overseen by
                the Office of the Information Commissioner (OIC).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">1. Who We Are (Data Controller)</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                EasyCollect is the data controller for the personal data described in this
                policy. For any privacy matter — including access, correction, or erasure
                requests — contact our data protection contact at{' '}
                <a href="mailto:privacy@easycollectja.com" className="text-blue-600 hover:underline">privacy@easycollectja.com</a>.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Note on roles: when a landlord uses EasyCollect to manage their own tenants
                and borrowers, the landlord is the controller of that tenant/borrower data and
                EasyCollect acts as a processor on the landlord's behalf for those records.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">2. Information We Collect</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you create an account, we collect your name, email address, and password.
                If you are a landlord, we also collect company information, bank details (for
                display on tenant invoices), and property/unit data. If you are a tenant or
                borrower added by a landlord, we collect your name, contact information, lease
                or loan details, and any payment proof uploads.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                We deliberately practise data minimisation: we do not collect your TRN/NIS,
                date of birth, or government ID. We also collect limited technical data
                (e.g. pages visited and error diagnostics) to operate and secure the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">3. Lawful Basis for Processing</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Under the JDPA we rely on the following lawful bases:
              </p>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li><strong>Contractual necessity</strong> — to provide the EasyCollect service to landlords under our Terms of Service, and to process the rent/loan collection relationship.</li>
                <li><strong>Legitimate interest</strong> — to record and track payments, prevent fraud, secure the platform, and improve the service.</li>
                <li><strong>Legal obligation</strong> — to retain financial records for the period required by Jamaican tax law.</li>
                <li><strong>Consent</strong> — for optional communications; you may withdraw consent at any time.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">4. How We Use Your Information</h2>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li>To provide and maintain the EasyCollect service</li>
                <li>To process and track rent payments, loans, and invoices</li>
                <li>To send email notifications and payment reminders</li>
                <li>To display landlord bank details on tenant payment pages</li>
                <li>To provide customer support</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal and tax record-keeping obligations</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">5. Data Storage & Security</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your data is stored using Supabase with encryption at rest and in transit, and
                the service is served exclusively over HTTPS. Every database table is protected
                by row-level security so each landlord can only access their own records and
                each tenant only their own. Passwords are hashed and never stored in plain
                text. Payment proof images are kept in access-controlled storage.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                We do not process actual financial transactions ourselves except via our
                payment partners. EasyCollect is primarily a payment tracking and verification
                platform — tenants submit proof of payment which landlords verify.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">6. Sharing & Sub-Processors</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We do not sell, trade, or rent your personal information. We share data only
                with the service providers we rely on to operate EasyCollect, each bound by a
                data processing agreement:
              </p>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li><strong>Supabase</strong> — database, authentication, and file storage</li>
                <li><strong>Resend</strong> — transactional and reminder emails</li>
                <li><strong>Sentry</strong> — error and performance monitoring</li>
                <li><strong>OpenAI</strong> — powers the in-app AI assistant</li>
                <li><strong>LuniPay / payment partners</strong> — online card payments, where enabled by your landlord</li>
                <li><strong>Between landlord and tenant</strong> — landlord bank details are shown to tenants on payment pages; tenant names and payment info are shown to their landlord</li>
                <li><strong>Legal requirements</strong> — where required by law, regulation, or legal process</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">7. International Transfers</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Some of our service providers process data on servers located outside Jamaica.
                Where personal data is transferred internationally, we rely on providers that
                offer contractual data-protection safeguards consistent with the JDPA.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">8. Data Retention</h2>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li><strong>Financial records</strong> (invoices, payments, loan records) — retained for up to 7 years to comply with the Income Tax Act.</li>
                <li><strong>Tenant &amp; borrower personal details</strong> (name, email, phone) — retained for the duration of the tenancy or loan plus 1 year, after which they are automatically anonymized.</li>
                <li><strong>Account data</strong> — retained while your account is active and removed or anonymized after closure, subject to the legal retention periods above.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">9. Your Rights Under the JDPA</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                You have the right to:
              </p>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li><strong>Access</strong> — download a copy of your data from Settings → Privacy &amp; Data, or by request.</li>
                <li><strong>Rectification</strong> — correct inaccurate data in your account or by request.</li>
                <li><strong>Erasure</strong> — request deletion of your personal data, subject to the legal retention periods above.</li>
                <li><strong>Object / restrict</strong> — object to certain processing and opt out of non-essential emails in your notification settings.</li>
                <li><strong>Complain</strong> — lodge a complaint with the Office of the Information Commissioner (OIC) at{' '}
                  <a href="https://oic.gov.jm" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">oic.gov.jm</a>.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">10. Data Breaches</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                In the event of a personal data breach that is likely to affect your rights, we
                will notify the Office of the Information Commissioner within 72 hours of
                becoming aware of it, and will inform affected users where required by the JDPA.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">11. Cookies & Local Storage</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We use browser local storage to maintain your login session, remember UI
                preferences, and track daily AI chat usage limits. We do not use third-party
                tracking cookies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">12. Changes to This Policy</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any
                material changes by posting the new policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">13. Contact</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                For any privacy question or to exercise your rights, contact us at{' '}
                <a href="mailto:privacy@easycollectja.com" className="text-blue-600 hover:underline">privacy@easycollectja.com</a>{' '}
                or{' '}
                <a href="mailto:support@easycollectja.com" className="text-blue-600 hover:underline">support@easycollectja.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} EasyCollect. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-slate-600 font-medium">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
