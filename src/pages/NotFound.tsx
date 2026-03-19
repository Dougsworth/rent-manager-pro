import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-4">
        <Link to="/dashboard">
          <BrandLogo className="text-xl font-extrabold tracking-tight text-slate-900" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="relative mb-8">
            <p className="text-[120px] font-bold text-slate-100 leading-none select-none">404</p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Search className="h-7 w-7 text-slate-400" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Page not found
          </h1>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-11 px-5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link to="/dashboard" className={buttonVariants({ className: "h-11 px-5" })}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-6 py-4 text-center">
        <p className="text-xs text-slate-400">
          Need help? Contact us at{" "}
          <a href="mailto:support@easycollectja.com" className="text-blue-500 hover:underline">
            support@easycollectja.com
          </a>
        </p>
      </div>
    </div>
  );
}
