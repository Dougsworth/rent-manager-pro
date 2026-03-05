import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Login() {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12">
            <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your password"
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

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Sign in
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-slate-900 hover:text-slate-700">
              Get started free
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background image — fills entire panel */}
        <img
          src="/buildingggimage.png"
          alt=""
          className="login-mockup absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay so text is readable */}
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/70" />

        <p className="relative z-10 text-sm text-slate-300/70">
          Rent collection made simple — for landlords who value their time.
        </p>

        <div className="relative z-10 space-y-6">
          <h2 className="text-6xl font-bold leading-tight drop-shadow-lg">
            Welcome
            <br />
            <span className="text-blue-400">back</span>
          </h2>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-slate-300/60">Landlords</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold">10hrs</p>
              <p className="text-sm text-slate-300/60">Saved monthly</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold">J$2M+</p>
              <p className="text-sm text-slate-300/60">Rent collected</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <BrandLogo className="text-xl font-extrabold tracking-tight" coinColor="rgba(255,255,255,0.5)" />
        </div>
      </div>
    </div>
  );
}
