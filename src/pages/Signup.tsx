import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signupSchema } from '@/schemas';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { AuthShell, FormError, GoogleButton, PasswordInput, TextField } from './Login';

export default function Signup() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const role = 'landlord' as const;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = signupSchema.safeParse({ firstName, lastName, email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName, role });
    if (error) setError(error);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <AuthShell>
        <SEO title="Check your email" path="/signup" />
        <h1 className="display text-[40px] font-bold leading-[1.05]">Check your email</h1>
        <p className="mt-3 text-[17px]">
          We sent a link to <strong className="font-semibold">{email}</strong>. Open it to confirm your account.
        </p>
        <ul className="mt-7 text-[15px]">
          <li className="border-t border-rule py-3">
            <span className="font-semibold">Confirm your email.</span>{' '}
            <span className="text-quiet">It can take a minute. If it is not in your inbox, look in spam.</span>
          </li>
          <li className="border-t border-rule py-3">
            <span className="font-semibold">Log in and add who owes you.</span>{' '}
            <span className="text-quiet">A property and its tenants, or a borrower and their loan.</span>
          </li>
          <li className="border-y border-rule py-3">
            <span className="font-semibold">Check Today.</span>{' '}
            <span className="text-quiet">It shows who owes you, how much, and who to chase first.</span>
          </li>
        </ul>
        <Link to="/login" className={buttonVariants({ size: 'lg', className: 'mt-7 w-full text-[15px]' })}>
          Go to log in
        </Link>
        <p className="mt-4 text-[13.5px] text-quiet">
          Wrong email? <button type="button" onClick={() => setSuccess(false)} className="cursor-pointer font-medium text-shell underline">Go back and fix it</button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <SEO
        title="Create a free account"
        description="Create a free EasyCollect account. Track rent and personal loans, send pay links and keep proof of every payment."
        path="/signup"
      />
      <h1 className="display text-[40px] font-bold leading-[1.05]">Create your account</h1>
      <p className="mt-2 text-[15px] text-quiet">EasyCollect is free for now. No card needed.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="firstName" label="First name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField id="lastName" label="Last name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="new-password"
            aria-describedby="password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="password-hint" className="mt-1.5 text-[13.5px] text-quiet">At least 6 characters.</p>
        </div>
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
          Create account
        </Button>
        <p className="text-[13.5px] text-quiet">
          By creating an account you agree to the <Link to="/terms" className="text-shell underline">Terms</Link> and{' '}
          <Link to="/privacy" className="text-shell underline">Privacy Policy</Link>.
        </p>
      </form>

      <GoogleButton />

      <p className="mt-8 border-t border-rule pt-5 text-[15px] text-quiet">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-shell underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
