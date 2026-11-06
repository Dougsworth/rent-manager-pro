import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink">
      <header className="bg-shell px-4 py-3 text-white sm:px-8">
        <Link to="/dashboard" className="text-lg"><BrandLogo /></Link>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-14 sm:px-8">
        <h1 className="display text-[34px] font-bold leading-[1.05] sm:text-[40px]">We could not find that page</h1>
        <p className="mt-3 text-[17px] text-quiet">The link may be old or typed wrong. Everything you were working on is still in your account.</p>
        <Link to="/dashboard" className={buttonVariants({ size: "lg", className: "mt-6 max-sm:w-full" })}>
          Go to Today
        </Link>
        <p className="mt-10 border-t border-rule pt-4 text-[13.5px] text-quiet">
          Still stuck? Email{" "}
          <a href="mailto:support@easycollectja.com" className="font-medium text-shell underline">support@easycollectja.com</a>
        </p>
      </main>
    </div>
  );
}
