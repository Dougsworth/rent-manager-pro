import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, ShieldCheck, KeyRound, Fingerprint } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
          <div className="w-full max-w-sm mx-auto text-center space-y-6">
            <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900" />
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invalid or expired link</h1>
            <p className="text-slate-500">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                Request New Link
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-blue-500/10" />
          <div className="relative z-10" />
          <div className="relative z-10 flex items-center justify-center">
            <ShieldCheck className="h-32 w-32 text-white/[0.06]" />
          </div>
          <div className="relative z-10">
            <BrandLogo className="text-xl font-extrabold tracking-tight" coinColor="rgba(255,255,255,0.5)" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12">
            <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900" />
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Password updated</h1>
              <p className="text-slate-500">
                Your password has been changed successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Set new password</h1>
                <p className="mt-2 text-slate-500">Choose a strong password to secure your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">New password</Label>
                  <div className="mt-1.5 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm password</Label>
                  <div className="mt-1.5 relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Update Password
                  {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-blue-500/10" />

        <p className="relative z-10 text-sm text-slate-400">
          Your account security is our priority.
        </p>

        <div className="relative z-10 space-y-6">
          <h2 className="text-6xl font-bold leading-tight">
            Secure your
            <br />
            <span className="text-blue-400">account</span>
          </h2>

          {/* Security visual — shield + checklist */}
          <div className="reset-mockup relative w-full max-w-md select-none" aria-hidden="true">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-5 shadow-2xl shadow-black/20 status-shimmer">
              {/* Shield icon center */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-blue-400/80" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Account Protection</p>
                  <p className="text-[9px] text-white/25">Multi-layer security</p>
                </div>
              </div>

              {/* Security features list */}
              <div className="space-y-2.5">
                {[
                  { icon: Lock, label: 'Encrypted password storage', detail: 'AES-256 encryption at rest', delay: 'security-row-0' },
                  { icon: KeyRound, label: 'Secure session tokens', detail: 'Auto-expire after 24 hours', delay: 'security-row-1' },
                  { icon: Fingerprint, label: 'Identity verification', detail: 'Email-based confirmation', delay: 'security-row-2' },
                  { icon: ShieldCheck, label: 'Account monitoring', detail: 'Unusual activity alerts', delay: 'security-row-3' },
                ].map((item, i) => (
                  <div key={i} className={`${item.delay} flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5`}>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-blue-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-white/50">{item.label}</p>
                      <p className="text-[8px] text-white/20">{item.detail}</p>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-400/70" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[9px] text-white/20">Last password change: 90 days ago</span>
                <span className="text-[9px] font-medium text-blue-400/50 px-1.5 py-0.5 rounded-full bg-blue-400/10">Update now</span>
              </div>
            </div>
            {/* Glow behind the card */}
            <div className="glow-pulse absolute -inset-4 -z-10 bg-blue-500/[0.08] rounded-2xl blur-2xl" />
          </div>
        </div>

        <div className="relative z-10">
          <BrandLogo className="text-xl font-extrabold tracking-tight" coinColor="rgba(255,255,255,0.5)" />
        </div>
      </div>
    </div>
  );
}
