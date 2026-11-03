import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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
        <div className="flex-1 flex flex-col justify-center px-4 py-12 bg-white">
          <div className="w-full max-w-sm mx-auto text-center space-y-6">
            <BrandLogo className="text-2xl font-medium text-slate-900" />
            <div className="flex justify-center"><ShieldCheck className="h-7 w-7 text-slate-400" /></div>
            <h1 className="text-2xl font-medium text-slate-900">Invalid or expired link</h1>
            <p className="text-slate-500">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                Request new link
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
            <div className="flex-1 flex flex-col justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <BrandLogo className="text-2xl font-medium text-slate-900" />
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex"><CheckCircle className="h-7 w-7 text-slate-400" /></div>
              <h1 className="text-2xl font-medium text-slate-900">Password updated</h1>
              <p className="text-slate-500">
                Your password has been changed successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-medium text-slate-900">Set new password</h1>
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
                  Update password
                  {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
