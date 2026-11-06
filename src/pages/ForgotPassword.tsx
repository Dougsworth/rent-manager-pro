import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { AuthShell, FormError, TextField } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter the email address you signed up with.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'We could not send the reset email. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <SEO
        title="Reset your password"
        description="Forgot your EasyCollect password? We will email you a link to set a new one."
        path="/forgot-password"
      />
      {sent ? (
        <>
          <h1 className="display text-[40px] font-bold leading-[1.05]">Check your email</h1>
          <p className="mt-3 text-[17px]">
            We sent a reset link to <strong className="font-semibold">{email}</strong>. Open it to set a new password.
          </p>
          <p className="mt-3 text-[15px] text-quiet">Nothing after a few minutes? Look in spam, or try again.</p>
          <div className="mt-7 flex flex-col gap-3">
            <Button variant="outline" size="lg" onClick={() => setSent(false)} className="w-full text-[15px]">
              Try a different email
            </Button>
          </div>
          <p className="mt-8 border-t border-rule pt-5 text-[15px]">
            <Link to="/login" className="font-semibold text-shell underline">Back to log in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="display text-[40px] font-bold leading-[1.05]">Reset your password</h1>
          <p className="mt-2 text-[15px] text-quiet">Enter the email you signed up with and we will send you a link to set a new one.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <TextField
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormError message={error} />
            <Button type="submit" size="lg" className="w-full text-[15px]" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Send reset link
            </Button>
          </form>

          <p className="mt-8 border-t border-rule pt-5 text-[15px] text-quiet">
            Remembered it? <Link to="/login" className="font-semibold text-shell underline">Back to log in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
