import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, Quote } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-400/80 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated white radial glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float-slow-reverse" />

        <div className="relative z-10 animate-slide-in-left">
          <div className="flex items-center gap-3">
            <Building2 className="h-10 w-10" />
            <span className="text-2xl font-bold">EasyCollect</span>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-blue-100/70 text-sm font-semibold tracking-widest uppercase animate-slide-in-left">
            Welcome back to
          </p>
          <h1 className="text-5xl font-bold leading-tight animate-slide-in-left-delay-1">
            Your Property
            <br />
            Command Center
          </h1>
          <p className="text-blue-100/80 text-lg max-w-md animate-slide-in-left-delay-2">
            Collect rent on autopilot, track every unit, and never chase a late payment again.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 relative z-10 animate-fade-in-up-delay-4">
          <Quote className="h-8 w-8 text-blue-200/60 mb-3" />
          <p className="text-blue-50/90 italic">
            "I used to spend weekends tracking down rent checks. Now everything hits my account automatically — I actually enjoy being a landlord again."
          </p>
          <p className="text-blue-200/70 text-sm mt-3">— Sarah M., 12-unit Property Manager</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4 animate-fade-in-up">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">EasyCollect</span>
          </div>

          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-slate-500">
              Sign in to pick up right where you left off.
            </p>
          </div>

          <div className="relative animate-fade-in-up-delay-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 tracking-wider">
                Continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up-delay-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-slate-700">Email address</Label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="text-center animate-fade-in-up-delay-3">
            <span className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </span>
          </div>

          <p className="text-center text-xs text-slate-400 animate-fade-in-up-delay-4">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
