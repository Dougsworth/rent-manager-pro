import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="Terms of Service"
        description="EasyCollect terms of service — the terms and conditions for using our rent collection platform."
        path="/terms"
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
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Terms of Service</h1>
              <p className="text-sm text-slate-400">Last updated: February 28, 2026</p>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                By accessing or using EasyCollect ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">2. Description of Service</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                EasyCollect is a rent collection management platform that helps landlords track properties, tenants, invoices, and payments. The Service provides tools for invoice generation, payment proof verification, email reminders, and reporting.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>EasyCollect does not process financial transactions.</strong> The platform facilitates payment tracking and verification — landlords and tenants handle actual money transfers through their own banking channels. EasyCollect is not a payment processor, bank, or financial institution.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">3. Account Responsibilities</h2>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>You are responsible for all activity that occurs under your account</li>
                <li>You must be at least 18 years old to use this Service</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">4. Acceptable Use</h2>
              <p className="text-sm text-slate-600 leading-relaxed">You agree not to:</p>
              <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Upload false, misleading, or fraudulent payment proofs</li>
                <li>Attempt to gain unauthorized access to other users' accounts or data</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Use the Service to harass, threaten, or discriminate against tenants</li>
                <li>Resell or redistribute access to the Service without authorization</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">5. Data & Content</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                You retain ownership of all data you input into the Service (property details, tenant information, invoices, etc.). By using the Service, you grant us a limited license to store, process, and display your data as necessary to provide the Service.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                You are responsible for ensuring that any bank details, tenant information, or other data you provide is accurate and that you have the right to share it through the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">6. Free Plan & Pricing</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                EasyCollect currently offers a free plan with access to core features. We may introduce paid plans in the future. Any pricing changes will be communicated in advance and will not affect your existing data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">7. Limitation of Liability</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                EasyCollect is provided "as is" without warranties of any kind. We are not liable for any disputes between landlords and tenants, incorrect payment verifications, or financial losses arising from the use of the Service. We do not guarantee uninterrupted or error-free service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">8. Termination</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time through your account settings. Upon termination, your data may be retained for a reasonable period for legal and operational purposes before permanent deletion.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">9. Changes to Terms</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms. Material changes will be communicated via email or in-app notification.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                If you have any questions about these terms, please contact us at{' '}
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
            <Link to="/terms" className="text-slate-600 font-medium">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
