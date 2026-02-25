import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AiChat } from "@/components/AiChat";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tenants", href: "/tenants", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = profile
    ? `${(profile.first_name?.[0] ?? '').toUpperCase()}${(profile.last_name?.[0] ?? '').toUpperCase()}` || '?'
    : '?';

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : '';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
        {/* Desktop Navigation */}
        <nav className="hidden lg:block glass-strong border-b border-white/60 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14">
              <div className="flex items-center">
                <Link to="/dashboard" className="text-sm font-semibold text-slate-900 tracking-tight">
                  EasyCollect
                </Link>
                <div className="hidden md:ml-8 md:flex md:space-x-0.5">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                          isActive
                            ? "bg-white/80 text-slate-900 shadow-sm border border-slate-200/60"
                            : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{displayName}</span>
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium ring-2 ring-white/60">
                  {initials}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors duration-150"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="lg:hidden glass-strong border-b border-white/60 sticky top-0 z-30">
          <div className="px-4">
            <div className="flex justify-between h-14 items-center">
              <Link to="/dashboard" className="text-sm font-semibold text-slate-900 tracking-tight">
                EasyCollect
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors duration-150"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-white/60 transition-colors duration-150"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="px-2 pb-3 space-y-1 border-t border-slate-100/60">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      isActive
                        ? "bg-white/80 text-slate-900 shadow-sm"
                        : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <AiChat />
      </div>
    </TooltipProvider>
  );
}
