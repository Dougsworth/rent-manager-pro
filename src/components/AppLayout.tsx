import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BrandLogo, { CoinSvg } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  CalendarDays,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AiChat } from "@/components/AiChat";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AnnouncementBanner } from "@/components/AnnouncementPopup";
import { SetupGuide } from "@/components/SetupGuide";
import { NotificationBell } from "@/components/NotificationBell";

const SIDEBAR_COLLAPSED = 64;   // px
const SIDEBAR_EXPANDED = 220;   // px

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Home },
  { name: "Tenants", href: "/tenants", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Activity Log", href: "/activity-log", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const initials = profile
    ? `${(profile.first_name?.[0] ?? '').toUpperCase()}${(profile.last_name?.[0] ?? '').toUpperCase()}` || '?'
    : '?';

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : '';

  const sidebarWidth = sidebarHovered ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-[#f8f9fb]">
        {/* Desktop Sidebar */}
        <aside
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{ width: sidebarWidth }}
          className={cn(
            "hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col",
            "bg-white border-r border-slate-200/60",
            "transition-[width] duration-300 ease-in-out"
          )}
        >
          {/* Logo + Notification Bell */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100/60 overflow-visible">
            <Link to="/dashboard" className="flex items-center gap-2 tracking-tight min-w-0">
              {sidebarHovered ? (
                <BrandLogo className="text-base font-bold text-slate-900 whitespace-nowrap" />
              ) : (
                <span className="text-xl text-slate-900 flex-shrink-0">
                  <CoinSvg />
                </span>
              )}
            </Link>
            {sidebarHovered && <NotificationBell />}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-3 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              const navLink = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden",
                    isActive
                      ? "bg-white/80 text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-300",
                      sidebarHovered ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );

              if (!sidebarHovered) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                );
              }

              return navLink;
            })}
          </nav>

          {/* Bottom: User + Logout */}
          <div className="border-t border-slate-100/60 p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium ring-2 ring-white/60 flex-shrink-0">
                {initials}
              </div>
              <span
                className={cn(
                  "text-sm text-slate-600 truncate whitespace-nowrap transition-all duration-300",
                  sidebarHovered ? "opacity-100" : "opacity-0 w-0"
                )}
              >
                {displayName}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 w-full mt-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors duration-150 overflow-hidden"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap transition-all duration-300",
                      sidebarHovered ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    Sign out
                  </span>
                </button>
              </TooltipTrigger>
              {!sidebarHovered && <TooltipContent side="right">Sign out</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {/* Mobile Top Bar */}
        <nav className="lg:hidden bg-white border-b border-slate-200/60 sticky top-0 z-30">
          <div className="px-4">
            <div className="flex justify-between h-14 items-center">
              <Link to="/dashboard" className="tracking-tight">
                <BrandLogo className="text-base font-bold text-slate-900" />
              </Link>
              <div className="flex items-center gap-1">
                <NotificationBell />
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
        </nav>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={cn(
            "lg:hidden fixed left-0 top-0 h-full z-50 w-[min(280px,85vw)] bg-white border-r border-slate-200/60 transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100/60">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="tracking-tight">
              <BrandLogo className="text-base font-bold text-slate-900" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/60 transition-colors duration-150"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <nav className="py-3 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/80 text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Top banners */}
        <div style={{ marginLeft: sidebarWidth }} className="hidden lg:block transition-[margin-left] duration-300 ease-in-out">
          <AnnouncementBanner />
        </div>
        <div className="lg:hidden">
          <AnnouncementBanner />
        </div>

        {/* Main Content — margin transitions smoothly with sidebar */}
        <main
          style={{ marginLeft: sidebarWidth }}
          className="hidden lg:block transition-[margin-left] duration-300 ease-in-out"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter" key={location.pathname}>
            {children}
          </div>
        </main>

        {/* Mobile Main Content — no sidebar offset */}
        <main className="lg:hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 page-enter" key={location.pathname}>
            {children}
          </div>
        </main>

        <AiChat />
        <SetupGuide />
        <PWAInstallPrompt />
        <OfflineBanner />
      </div>
    </TooltipProvider>
  );
}
