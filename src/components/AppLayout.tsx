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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
                RentCollect
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                        isActive
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
              <span className="text-sm text-gray-600">{displayName}</span>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
              RentCollect
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="px-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
