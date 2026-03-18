import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="text-center max-w-md px-6">
        <p className="text-7xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Link to="/dashboard" className={buttonVariants()}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
