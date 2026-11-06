import { Link } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

/** Shared frame for the Privacy Policy and Terms of Service. */
export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-8 lg:px-11">
          <Link to="/" className="text-[22px]"><BrandLogo /></Link>
          <Link to="/" className="text-sm font-medium text-shell underline">Back to home</Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-8 sm:py-14 lg:px-11">
        <article className="mx-auto max-w-[680px]">
          <h1 className="display text-[40px] font-bold leading-[1.05] sm:text-[52px]">{title}</h1>
          <p className="mt-2 text-[13.5px] text-quiet">Last updated {updated}</p>
          <div className="mt-8 text-[15px] leading-relaxed [&_a]:text-shell [&_a]:underline [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1.5 [&_p+p]:mt-3 [&_section]:border-t [&_section]:border-rule [&_section]:py-6 [&_section>*+*]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-6 text-[13.5px] text-quiet sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-11">
          <p>&copy; {new Date().getFullYear()} EasyCollect</p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link to="/terms" className="hover:text-ink">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-ink">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="November 6, 2026">
      <SEO
        title="Privacy Policy"
        description="How EasyCollect collects, uses and protects your information."
        path="/privacy"
      />

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          When you create an account, we collect your name, email address, and password. If you are a landlord or lender, we also collect company information, bank details (for display on tenant invoices and payment pages), property and unit data, and the details of tenants, borrowers and loans you add. If you are a tenant, we collect your contact information and payment proof uploads.
        </p>
        <p>
          We automatically collect usage data such as pages visited, features used, and device information to improve our service.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the EasyCollect service</li>
          <li>To process and track rent payments, loan repayments and invoices</li>
          <li>To send email notifications and payment reminders</li>
          <li>To display landlord bank details on tenant payment pages</li>
          <li>To provide customer support</li>
          <li>To detect and prevent fraud or abuse</li>
          <li>To improve our service based on usage patterns</li>
        </ul>
      </section>

      <section>
        <h2>3. Data Storage and Security</h2>
        <p>
          Your data is stored using Supabase, which provides encryption at rest and in transit. Database access rules limit each account to its own records. Passwords are hashed and never stored in plain text.
        </p>
        <p>
          Payment proof images and lease documents are kept in Supabase Storage under randomly generated file names. Anyone who has the direct link to one of these files can open it, so please do not share those links.
        </p>
        <p>
          We do not hold or move your money. EasyCollect is a payment tracking and verification platform. Tenants submit proof of payment (for example, bank transfer screenshots), which landlords verify manually. If a landlord turns on online payments, card payments are processed by HandyPay, not by EasyCollect.
        </p>
      </section>

      <section>
        <h2>4. Information Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
        <ul>
          <li><strong>Service providers:</strong> Supabase (database, authentication and file storage), Resend (email delivery), Sentry (error monitoring), OpenAI (answers in the in-app assistant, only when you use it), and HandyPay (online card payments, only when a landlord turns them on)</li>
          <li><strong>Between landlord and tenant:</strong> Landlord bank details are shown to tenants on payment pages. Tenant names and payment info are shown to their landlord.</li>
          <li><strong>Legal requirements:</strong> If required by law, regulation, or legal process</li>
        </ul>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>
          You can view and update your personal information in your account settings. To get a full export of your data, or to have your account and data deleted, contact us and we will handle it. You may opt out of non-essential email notifications in your notification settings.
        </p>
      </section>

      <section>
        <h2>6. Cookies and Local Storage</h2>
        <p>
          We use browser local storage to maintain your login session, remember interface preferences (such as dismissed setup guides), and track daily AI assistant usage limits. We do not use third-party tracking cookies.
        </p>
      </section>

      <section>
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          If you have any questions about this privacy policy, please contact us at{' '}
          <a href="mailto:support@easycollectja.com">support@easycollectja.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
