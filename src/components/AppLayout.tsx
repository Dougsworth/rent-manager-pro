import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus, X, Sun, Users, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AiChat } from "@/components/AiChat";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AnnouncementBanner } from "@/components/AnnouncementPopup";
import { SetupGuide } from "@/components/SetupGuide";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/collect/GlobalSearch";
import BrandLogo from "@/components/BrandLogo";

const today = { name: "Today", href: "/dashboard" };

const groups = [
  { label: "People", items: [{ name: "Tenants", href: "/tenants" }, { name: "Borrowers", href: "/borrowers" }] },
  {
    label: "Money",
    items: [
      { name: "Invoices", href: "/invoices" },
      { name: "Payments", href: "/payments" },
      { name: "Reminders", href: "/reminders" },
      { name: "Loans", href: "/loans" },
    ],
  },
  {
    label: "Places and records",
    items: [
      { name: "Properties", href: "/properties" },
      { name: "Calendar", href: "/calendar" },
      { name: "Reports", href: "/reports" },
      { name: "Activity", href: "/activity-log" },
      { name: "Settings", href: "/settings" },
    ],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const link = (item: { name: string; href: string }) => {
    const on = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        aria-current={on ? "page" : undefined}
        className={cn(
          "block py-2 pl-5 pr-4 text-[15px] text-shell-ink hover:text-white focus-visible:outline-white focus-visible:-outline-offset-2",
          on && "font-semibold text-white shadow-[inset_3px_0_0_var(--color-marker)]"
        )}
      >
        {item.name}
      </Link>
    );
  };
  return (
    <>
      {link(today)}
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1 mt-5 px-5 text-xs text-[#9db9ab]">{g.label}</p>
          {g.items.map(link)}
        </div>
      ))}
    </>
  );
}

/** On phones, sibling screens sit one tap apart instead of behind the menu. */
const sections = [
  [{ name: "Tenants", href: "/tenants" }, { name: "Borrowers", href: "/borrowers" }],
  [{ name: "Invoices", href: "/invoices" }, { name: "Payments", href: "/payments" }, { name: "Reminders", href: "/reminders" }, { name: "Loans", href: "/loans" }],
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email : "";
  const recordPayment = () => navigate("/payments?record=1");
  const section = sections.find((s) => s.some((i) => pathname === i.href));

  const tab = (name: string, href: string, Icon: typeof Sun, match: string[]) => {
    const on = match.some((m) => pathname.startsWith(m));
    return (
      <Link to={href} aria-current={on ? "page" : undefined} className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-shell-ink", on && "font-semibold text-white")}>
        <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={on ? 2.25 : 1.75} />
        {name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-ground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:bg-popover focus:p-2">Skip to content</a>

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[216px] flex-col overflow-y-auto bg-shell lg:flex print:hidden">
        <Link to="/dashboard" className="px-5 pb-5 pt-6 text-xl text-white"><BrandLogo /></Link>
        <nav aria-label="Main" className="flex-1"><NavLinks pathname={pathname} /></nav>
        <div className="mt-6 px-5 pb-5 text-sm">
          <p className="truncate text-shell-ink">{displayName}</p>
          <button onClick={signOut} className="mt-1 min-h-8 cursor-pointer text-[#9db9ab] underline hover:text-white">Sign out</button>
        </div>
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-shell px-4 text-white lg:hidden print:hidden">
        <Link to="/dashboard" className="text-lg"><BrandLogo /></Link>
        <div className="-mr-2 flex items-center text-white [&_button]:text-white"><NotificationBell /></div>
      </header>

      <div className="lg:pl-[216px]">
        <div className="print:hidden"><AnnouncementBanner /></div>
        <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-4 sm:px-8 lg:px-11 lg:pb-10 lg:pt-6">
          <div className="mb-5 flex items-center gap-3 print:hidden">
            <GlobalSearch className="min-w-0 flex-1 lg:max-w-[340px] lg:ml-auto" />
            <div className="hidden lg:block"><NotificationBell /></div>
            <Button onClick={recordPayment} className="hidden lg:inline-flex">Record a payment</Button>
          </div>
          {section && (
            <nav aria-label="Section" className="-mt-1 mb-5 flex gap-5 overflow-x-auto border-b border-rule lg:hidden">
              {section.map((i) => (
                <Link key={i.href} to={i.href} className={cn("-mb-px flex min-h-11 items-center whitespace-nowrap border-b-2 text-sm", pathname === i.href ? "border-ink font-semibold" : "border-transparent text-quiet")}>{i.name}</Link>
              ))}
            </nav>
          )}
          <main id="main" className="page-enter" key={pathname}>{children}</main>
        </div>
      </div>

      {/* Phone tab bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex items-center bg-shell pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden">
        {tab("Today", "/dashboard", Sun, ["/dashboard"])}
        {tab("People", "/tenants", Users, ["/tenants", "/borrowers"])}
        <button onClick={recordPayment} aria-label="Record a payment" className="flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center rounded-[3px] bg-marker text-ink">
          <Plus aria-hidden="true" className="h-6 w-6" />
        </button>
        {tab("Money", "/invoices", Wallet, ["/invoices", "/payments", "/reminders", "/loans"])}
        <button onClick={() => setMoreOpen(true)} className="flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs text-shell-ink">
          <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          More
        </button>
      </nav>

      {/* Phone full menu */}
      {moreOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 overflow-y-auto bg-shell pb-8 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4 text-lg text-white">
            <BrandLogo />
            <button onClick={() => setMoreOpen(false)} aria-label="Close menu" className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center"><X className="h-6 w-6" /></button>
          </div>
          <nav aria-label="All pages"><NavLinks pathname={pathname} onNavigate={() => setMoreOpen(false)} /></nav>
          <div className="mt-6 px-5 text-sm">
            <p className="text-shell-ink">{displayName}</p>
            <button onClick={signOut} className="mt-1 min-h-11 cursor-pointer text-white underline">Sign out</button>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <AiChat />
        <SetupGuide />
        <PWAInstallPrompt />
        <OfflineBanner />
      </div>
    </div>
  );
}
