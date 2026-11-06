import SEO from '@/components/SEO';
import { LegalLayout } from './PrivacyPolicy';

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="November 6, 2026">
      <SEO
        title="Terms of Service"
        description="The terms for using EasyCollect to track rent, loans and payments."
        path="/terms"
      />

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using EasyCollect ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          EasyCollect is a collection management platform that helps landlords track properties, tenants, invoices, and payments, and helps lenders track borrowers, loans, and repayments. The Service provides tools for invoice generation, payment proof verification, email reminders, and reporting.
        </p>
        <p>
          <strong>EasyCollect does not hold or move your money.</strong> The platform facilitates payment tracking and verification. Landlords, lenders, tenants and borrowers handle actual money transfers through their own banking channels. If a landlord turns on online payments, card payments are processed by HandyPay under HandyPay's own terms. EasyCollect is not a payment processor, bank, or financial institution.
        </p>
      </section>

      <section>
        <h2>3. Account Responsibilities</h2>
        <ul>
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You must notify us immediately of any unauthorized access to your account</li>
          <li>You are responsible for all activity that occurs under your account</li>
          <li>You must be at least 18 years old to use this Service</li>
        </ul>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal or unauthorized purpose</li>
          <li>Upload false, misleading, or fraudulent payment proofs</li>
          <li>Attempt to gain unauthorized access to other users' accounts or data</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Use the Service to harass, threaten, or discriminate against tenants or borrowers</li>
          <li>Resell or redistribute access to the Service without authorization</li>
        </ul>
      </section>

      <section>
        <h2>5. Data and Content</h2>
        <p>
          You retain ownership of all data you input into the Service (property details, tenant and borrower information, invoices, loans, etc.). By using the Service, you grant us a limited license to store, process, and display your data as necessary to provide the Service.
        </p>
        <p>
          You are responsible for ensuring that any bank details, tenant or borrower information, or other data you provide is accurate and that you have the right to share it through the platform.
        </p>
      </section>

      <section>
        <h2>6. Free Plan and Pricing</h2>
        <p>
          EasyCollect is currently free to use. We plan to introduce a paid Pro plan in the future. Any pricing changes will be communicated in advance and will not affect your existing data.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          EasyCollect is provided "as is" without warranties of any kind. We are not liable for any disputes between landlords and tenants or lenders and borrowers, incorrect payment verifications, or financial losses arising from the use of the Service. We do not guarantee uninterrupted or error-free service.
        </p>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account if you violate these terms. You may ask us to delete your account at any time by contacting us. Upon termination, your data may be retained for a reasonable period for legal and operational purposes before permanent deletion.
        </p>
      </section>

      <section>
        <h2>9. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms. Material changes will be communicated via email or in-app notification.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          If you have any questions about these terms, please contact us at{' '}
          <a href="mailto:support@easycollectja.com">support@easycollectja.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
