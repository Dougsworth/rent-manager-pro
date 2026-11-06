import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { AuthShell, FormError, PasswordInput } from './Login';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match. Type them again.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'We could not save your new password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground" role="status" aria-label="Checking your link">
        <Loader2 className="h-6 w-6 animate-spin text-quiet" aria-hidden="true" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <AuthShell>
        <SEO title="Link expired" path="/reset-password" />
        <h1 className="display text-[40px] font-bold leading-[1.05]">This link has expired</h1>
        <p className="mt-3 text-[17px] text-quiet">Reset links only work once and stop working after a while. Ask for a new one and use it soon.</p>
        <Link to="/forgot-password" className={buttonVariants({ size: 'lg', className: 'mt-7 w-full text-[15px]' })}>
          Get a new link
        </Link>
        <p className="mt-8 border-t border-rule pt-5 text-[15px]">
          <Link to="/login" className="font-semibold text-shell underline">Back to log in</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <SEO title="Set a new password" path="/reset-password" />
      {success ? (
        <div role="status">
          <h1 className="display text-[40px] font-bold leading-[1.05]">Password saved</h1>
          <p className="mt-3 text-[17px] text-quiet">Taking you to log in.</p>
          <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-7 w-full text-[15px]' })}>
            Log in now
          </Link>
        </div>
      ) : (
        <>
          <h1 className="display text-[40px] font-bold leading-[1.05]">Set a new password</h1>
          <p className="mt-2 text-[15px] text-quiet">Use at least 6 characters. Something you do not use anywhere else is best.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <PasswordInput
              id="password"
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <FormError message={error} />
            <Button type="submit" size="lg" className="w-full text-[15px]" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save password
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
