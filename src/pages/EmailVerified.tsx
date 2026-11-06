import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

export default function EmailVerified() {
  return (
    <div className="min-h-screen bg-ground text-ink">
      <SEO title="Email Verified" description="Your email has been verified. You can now sign in to EasyCollect." path="/email-verified" />
      <header className="bg-shell px-4 py-3 text-white sm:px-8">
        <Link to="/" className="text-lg"><BrandLogo /></Link>
      </header>

      <main className="mx-auto max-w-md px-4 pt-14 sm:px-8">
        <h1 className="display text-[34px] font-bold leading-[1.05] sm:text-[40px]">Your email is confirmed</h1>
        <p className="mt-3 text-[17px] text-quiet">You can sign in now and pick up where you left off.</p>
        <Link to="/login" className={buttonVariants({ size: 'lg', className: 'mt-6 w-full' })}>
          Sign in
        </Link>
      </main>
    </div>
  );
}
