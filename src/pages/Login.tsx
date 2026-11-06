import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';
import type { FlatState } from '@/components/landing/KingstonScene';

const KingstonScene = lazy(() => import('@/components/landing/KingstonScene'));
const AUTH_FLATS: Record<number, FlatState> = { 1: 'paid', 2: 'paid', 3: 'due', 4: 'late', 5: 'paid', 6: 'late' };

/**
 * Shared frame for the sign in, sign up and password screens: one calm column on
 * the ground colour, and on wide screens the green field with the Kingston block
 * from the landing page and the promise under it.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const [sceneReady, setSceneReady] = useState(false);
  // Only load the 3D building where the panel shows, so phones never download it
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1024px)');
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return (
    <div className="min-h-screen bg-ground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)]">
      <div className="flex min-h-screen flex-col px-4 pb-10 pt-5 sm:px-8 lg:px-11">
        <Link to="/" className="self-start text-[22px] text-ink">
          <BrandLogo />
        </Link>
        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[380px]">{children}</div>
        </main>
      </div>
      <aside className="hidden h-screen bg-shell text-white lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="relative min-h-0 flex-1" aria-hidden="true">
          <img
            src="/screens/kingston-poster.webp"
            alt=""
            decoding="async"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${sceneReady ? 'opacity-0' : ''}`}
          />
          {wide && <Suspense fallback={null}>
            <KingstonScene flats={AUTH_FLATS} onReady={() => setSceneReady(true)} className="absolute inset-0" />
          </Suspense>}
        </div>
        <div className="px-11 pb-14">
          <p className="display text-[52px] font-medium leading-[1] tracking-[-0.03em] xl:text-[64px]"><span className="block">Stop chasing</span><span className="block text-shell-ink">Start collecting</span></p>
          <p className="mt-5 max-w-[36ch] text-[17px] text-shell-ink">
            Rent and personal loans, tracked, reminded and receipted. Built for landlords and lenders in Jamaica.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-l-2 border-late pl-3 text-[14px] text-late">
      {message}
    </p>
  );
}

export function PasswordInput({ id, label, aside, ...props }: InputProps & { id: string; label: string; aside?: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-ink">{label}</Label>
        {aside}
      </div>
      <div className="relative mt-1.5">
        <Input id={id} type={shown ? 'text' : 'password'} className="h-11 pr-16 text-[15px]" {...props} />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 cursor-pointer px-3 text-sm font-medium text-shell hover:underline"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export function TextField({ id, label, ...props }: InputProps & { id: string; label: string }) {
  return (
    <div>
      <Label htmlFor={id} className="text-ink">{label}</Label>
      <Input id={id} className="mt-1.5 h-11 text-[15px]" {...props} />
    </div>
  );
}

export function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const go = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(`Google sign in did not work. ${error}`);
    setLoading(false);
  };

  return (
    <>
      <div className="my-6 flex items-center gap-3 text-[13.5px] text-quiet" aria-hidden="true">
        <span className="h-px flex-1 bg-rule" />
        or
        <span className="h-px flex-1 bg-rule" />
      </div>
      <Button type="button" variant="outline" size="lg" onClick={go} disabled={loading} className="w-full text-[15px] text-ink">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {label}
      </Button>
      {error && <div className="mt-3"><FormError message={error} /></div>}
    </>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <AuthShell>
      <SEO
        title="Log in"
        description="Log in to EasyCollect to see who owes you, record payments and send reminders."
        path="/login"
      />
      <h1 className="display text-[40px] font-bold leading-[1.05]">Log in</h1>
      <p className="mt-2 text-[15px] text-quiet">Pick up where you left off.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <TextField
          id="email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          id="password"
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aside={<Link to="/forgot-password" className="text-sm font-medium text-shell underline">Forgot password?</Link>}
        />
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full text-[15px]" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Log in
        </Button>
      </form>

      <GoogleButton />

      <p className="mt-8 border-t border-rule pt-5 text-[15px] text-quiet">
        No account yet?{' '}
        <Link to="/signup" className="font-semibold text-shell underline">Create one free</Link>
      </p>
    </AuthShell>
  );
}
