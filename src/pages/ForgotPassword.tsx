import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
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
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12">
            <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900" />
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="h-7 w-7 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Check your email</h1>
              <p className="text-slate-500">
                We've sent a password reset link to <strong className="text-slate-900">{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-sm text-slate-400">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <Button variant="outline" onClick={() => setSent(false)} className="w-full border-slate-200">
                  Try a different email
                </Button>
                <Link to="/login">
                  <Button variant="ghost" className="w-full text-slate-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot password?</h1>
                <p className="mt-2 text-slate-500">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
                  <div className="mt-1.5 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Send Reset Link
                  {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-blue-500/10" />

        <p className="relative z-10 text-sm text-slate-400">
          Don't worry — we'll get you back in.
        </p>

        <div className="relative z-10 space-y-6">
          <h2 className="text-6xl font-bold leading-tight">
            Reset your
            <br />
            <span className="text-blue-400">password</span>
          </h2>

          {/* Dashboard preview mockup — scale variant */}
          <div className="forgot-mockup relative w-full max-w-md select-none" aria-hidden="true">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-4 shadow-2xl shadow-black/20 status-shimmer">
              {/* Mock header bar */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">Security</span>
                <span className="text-[10px] text-white/30">Account</span>
              </div>
              {/* Mock stat cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="stat-pop-1 rounded-lg bg-white/[0.06] border border-white/[0.06] p-2.5">
                  <p className="text-[9px] text-white/30 mb-1">Tenants</p>
                  <p className="text-sm font-bold text-blue-400/70">8</p>
                </div>
                <div className="stat-pop-2 rounded-lg bg-white/[0.06] border border-white/[0.06] p-2.5">
                  <p className="text-[9px] text-white/30 mb-1">Active</p>
                  <p className="text-sm font-bold text-emerald-400/70">6</p>
                </div>
                <div className="stat-pop-3 rounded-lg bg-white/[0.06] border border-white/[0.06] p-2.5">
                  <p className="text-[9px] text-white/30 mb-1">Invoices</p>
                  <p className="text-sm font-bold text-amber-400/70">24</p>
                </div>
              </div>
              {/* Mock activity rows */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] px-3 pb-1 border-b border-white/[0.05]">
                  <span className="text-white/25 uppercase tracking-wider">Recent Activity</span>
                  <span className="text-white/25 uppercase tracking-wider">Time</span>
                </div>
                {[
                  { action: 'Payment received', detail: 'A. Thompson — J$45,000', time: '2m ago', color: 'text-emerald-400/70 bg-emerald-400/10' },
                  { action: 'Invoice sent', detail: 'Unit 7C — March rent', time: '1h ago', color: 'text-blue-400/70 bg-blue-400/10' },
                  { action: 'Payment received', detail: 'R. Williams — J$38,000', time: '3h ago', color: 'text-emerald-400/70 bg-emerald-400/10' },
                  { action: 'Reminder sent', detail: 'M. Brown — overdue', time: '5h ago', color: 'text-amber-400/70 bg-amber-400/10' },
                ].map((row, i) => (
                  <div key={i} className={`row-fade-${i} flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2`}>
                    <div>
                      <p className="text-[10px] font-medium text-white/50">{row.action}</p>
                      <p className="text-[8px] text-white/20">{row.detail}</p>
                    </div>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${row.color}`}>{row.time}</span>
                  </div>
                ))}
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
