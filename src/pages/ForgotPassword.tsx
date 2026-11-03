import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

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
      <SEO
        title="Forgot Password"
        description="Reset your EasyCollect password. We'll send you a link to get back into your account."
        path="/forgot-password"
      />
            <div className="flex-1 flex flex-col justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <BrandLogo className="text-2xl font-medium text-slate-900" />
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="flex"><Mail className="h-7 w-7 text-slate-400" /></div>
              <h1 className="text-2xl font-medium text-slate-900">Check your email</h1>
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
                <h1 className="text-2xl font-medium text-slate-900">Forgot password?</h1>
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
                  Send reset link
                  {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                <Link to="/login" className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700 inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
