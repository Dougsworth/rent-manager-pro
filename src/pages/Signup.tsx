import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signupSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Mail, Lock, Eye, EyeOff, User, Loader2, Quote } from 'lucide-react';

export default function Signup() {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const role = 'landlord' as const;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = signupSchema.safeParse({ firstName, lastName, email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName, role });
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 mb-6">
                We've sent a confirmation link to <strong className="text-slate-900">{email}</strong>. Click the link to activate your account.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Built for landlords
          </p>
          <h1 className="text-5xl font-bold leading-tight animate-slide-in-left-delay-1">
            Rent Collection,
            <br />
            Simplified
          </h1>
          <p className="text-blue-100/80 text-lg max-w-md animate-slide-in-left-delay-2">
            Join hundreds of landlords who ditched the spreadsheets. Set up in minutes, get paid on time every month.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 relative z-10 animate-fade-in-up-delay-4">
          <Quote className="h-8 w-8 text-blue-200/60 mb-3" />
          <p className="text-blue-50/90 italic">
            "I signed up on a Monday and had all 6 of my units collecting rent by Wednesday. Wish I'd found this years ago."
          </p>
          <p className="text-blue-200/70 text-sm mt-3">— James R., Independent Landlord</p>
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
            <h2 className="text-3xl font-bold text-slate-900">Create Your Account</h2>
            <p className="mt-2 text-slate-500">
              Free to start. Takes less than a minute.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                <div className="mt-1.5 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                <div className="mt-1.5">
                  <Input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-700">Email address</Label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Min. 6 characters"
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
              Create Account
            </Button>
          </form>

          <div className="text-center animate-fade-in-up-delay-3">
            <span className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>

          <p className="text-center text-xs text-slate-400 animate-fade-in-up-delay-4">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
