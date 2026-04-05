import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SEO from '@/components/SEO';

export default function EmailVerified() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Email Verified" description="Your email has been verified. You can now sign in to EasyCollect." path="/email-verified" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <BrandLogo className="text-2xl font-extrabold tracking-tight text-slate-900" />
          </Link>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Email Verified</h2>
            <p className="text-slate-500 mb-6">
              Your email has been verified successfully. You can now sign in to your account.
            </p>
            <Link to="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Continue to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
