import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Upload,
  CheckCircle,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Bell,
  Link as LinkIcon,
  LogIn,
  Check,
  X,
  Plus,
  Minus,
  Receipt,
} from 'lucide-react';

/* ── Section Divider (HandyPay-style + markers on edges) ── */
function SectionDivider() {
  return (
    <div className="relative h-px w-full">
      <div className="absolute inset-0 bg-neutral-200" />
    </div>
  );
}

/* ── FAQ Item ── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
      >
        <span className="text-lg sm:text-xl font-medium text-neutral-900 pr-4">{question}</span>
        <span className="flex-shrink-0">
          {open ? (
            <Minus className="w-5 h-5 text-blue-600" />
          ) : (
            <Plus className="w-5 h-5 text-blue-600" />
          )}
        </span>
      </button>
      {open && (
        <div className="pb-6 pr-12">
          <p className="text-neutral-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black antialiased">
      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="transition-all duration-500 max-w-7xl mx-auto py-5 px-6">
          <div className="relative flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 relative z-10">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-semibold text-neutral-900">EasyCollect</span>
            </Link>

            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 px-1.5 py-1.5">
                <a href="#features" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Features</a>
                <a href="#how-it-works" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">How It Works</a>
                <a href="#pricing" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Plans</a>
                <a href="#testimonials" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Testimonials</a>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full transition-colors hover:bg-neutral-100"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap font-medium h-9 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-4 py-2 text-[13px] cursor-pointer transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN — bordered content area ═══ */}
      <main className="flex flex-col border-x border-neutral-200 max-w-7xl mx-auto relative">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-28 md:pt-32 pb-16 w-full overflow-hidden bg-white">
          <div className="container mx-auto max-w-6xl w-full px-4 sm:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs sm:text-sm text-neutral-600">Built for Jamaican landlords</span>
                <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                  Learn more
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-neutral-900 leading-[1.1] tracking-tight mb-4">
                The simplest way to<br />collect <span className="text-blue-600">rent</span>.
              </h1>

              <p className="text-base md:text-lg text-neutral-600 max-w-xl mb-8 leading-relaxed">
                Send invoices, share payment links, get proof of payment, and track collections — all from one platform built for Jamaican landlords.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full sm:w-auto px-4 sm:px-0">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer relative bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm w-48 shadow-lg shadow-blue-600/25"
                >
                  Get started free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors w-48"
                >
                  See how it works
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <div className="w-5 h-5 rounded bg-blue-600/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />
                </div>
                <span>Free forever, No credit card required</span>
              </div>
            </div>
          </div>

          {/* Hero showcase — two-panel mockup */}
          <div className="w-full px-4 sm:px-6 pb-16 pt-8">
            <div className="relative w-full mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ maxWidth: 1128, height: 500 }}>
              {/* Left panel — Invoice mockup */}
              <div className="relative bg-blue-700 flex items-center justify-center w-full md:w-[450px] rounded-2xl md:rounded-none">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '80px 80px',
                }} />
                <div className="relative z-10 p-8 w-full max-w-[340px]">
                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                      <p className="text-white/70 text-xs font-medium">INV-ARB-003</p>
                      <p className="text-white text-lg font-bold mt-1">Monthly Rent</p>
                    </div>
                    <div className="p-5 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-400">Amount</span><span className="text-xl font-bold text-neutral-900">J$85,000</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400">Due</span><span className="font-medium text-neutral-900">Feb 28, 2026</span></div>
                      <div className="flex justify-between items-center"><span className="text-neutral-400">Status</span><span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full ring-1 ring-amber-200">unpaid</span></div>
                      <div className="bg-neutral-50 rounded-lg p-3 space-y-1 text-xs mt-2">
                        <p className="font-medium text-neutral-600 uppercase tracking-wide mb-1.5">Bank Details</p>
                        <p><span className="text-neutral-400">Bank:</span> <strong className="text-neutral-700">NCB Jamaica</strong></p>
                        <p><span className="text-neutral-400">Account:</span> <strong className="text-neutral-700">Property Mgmt Ltd</strong></p>
                      </div>
                      <button className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 mt-2">
                        <Upload className="h-4 w-4" /> Upload Proof
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right panel — Dashboard mockup */}
              <div className="relative bg-blue-600 flex items-center justify-center hidden md:flex md:flex-1">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '80px 80px',
                }} />
                <div className="relative z-10 p-8 w-full max-w-[540px]">
                  <div className="bg-white rounded-xl shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">Dashboard</h3>
                        <p className="text-xs text-neutral-400">February 2026</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">This Month</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Expected', value: 'J$840,000', c: 'text-neutral-900' },
                        { label: 'Collected', value: 'J$680,000', c: 'text-emerald-600' },
                        { label: 'Outstanding', value: 'J$160,000', c: 'text-amber-600' },
                        { label: 'Overdue', value: '2', c: 'text-red-600' },
                      ].map((s) => (
                        <div key={s.label} className="bg-neutral-50 rounded-lg p-3">
                          <p className="text-[10px] font-medium text-neutral-400 mb-0.5">{s.label}</p>
                          <p className={`text-base font-bold ${s.c}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-50 rounded-lg px-4 py-2.5">
                      <p className="text-xs font-medium text-neutral-500">Collection</p>
                      <div className="flex-1 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-[81%]" />
                      </div>
                      <p className="text-xs font-bold text-blue-600">81%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="relative py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Everything You Need To Get Paid
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                Send invoices, track payments, automate reminders, and manage your entire rent collection from one simple dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {[
                {
                  icon: FileText,
                  title: 'Automatic invoicing',
                  desc: 'Generate invoices with per-tenant auto-numbering (INV-ARB-001). Track every dollar owed, per tenant, per month.',
                },
                {
                  icon: LinkIcon,
                  title: 'Shareable payment links',
                  desc: 'Each invoice gets a unique link your tenant opens on any device — view amount, bank details, and upload proof. No account needed.',
                },
                {
                  icon: Upload,
                  title: 'Proof of payment upload',
                  desc: 'Tenants upload screenshots of their bank transfers. You review, approve, or reject with one click.',
                },
                {
                  icon: Bell,
                  title: 'Smart email reminders',
                  desc: 'Send one-click manual reminders or enable automatic daily nudges for overdue invoices. Never chase again.',
                },
              ].map((f) => (
                <div key={f.title} className="relative bg-neutral-50 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 280 }}>
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }} />
                  <div className="relative z-10 p-6 flex-1 flex flex-col">
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{f.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="relative py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 mb-6">
                Get Paid in 3 Simple Steps
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-8">
                Create an invoice, share the link, and approve the proof. Start collecting rent in minutes, not days.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer relative bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm w-48"
                >
                  Get started
                </Link>
                <a href="#pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors w-48">
                  View plans
                </a>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-5 mt-20 px-4 md:px-0">
              {[
                {
                  icon: FileText,
                  step: '01',
                  title: 'Create & send invoice',
                  desc: 'Generate an invoice with one click. Share the payment link via WhatsApp, email, or text message.',
                },
                {
                  icon: Upload,
                  step: '02',
                  title: 'Tenant pays & uploads proof',
                  desc: 'Tenant opens the link, sees your bank details, transfers the money, and uploads a screenshot as proof.',
                },
                {
                  icon: CheckCircle,
                  step: '03',
                  title: 'Approve & track',
                  desc: 'Review the payment proof, mark it as approved, and watch your collection rate climb on the dashboard.',
                },
              ].map((item) => (
                <div key={item.step} className="relative bg-neutral-50 rounded-xl overflow-hidden flex flex-col flex-shrink-0 w-full md:w-[320px]" style={{ minHeight: 280 }}>
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }} />
                  <div className="relative z-10 p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-blue-600">{item.step}</span>
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900 mb-2">{item.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ DASHBOARD / MANAGEMENT ═══ */}
        <section className="relative py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 mb-6">
                Manage Properties, Tenants,<br className="hidden md:block" />And Payments From Anywhere.
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-8">
                Your dashboard shows everything at a glance — expected revenue, collection progress, overdue tenants, and recent payments. No spreadsheets needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup" className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer relative bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm w-48">
                  Start for free
                </Link>
                <a href="#features" className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors w-48">
                  Explore features
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
              {/* Left column */}
              <div className="contents lg:flex lg:flex-col gap-5">
                {[
                  { icon: BarChart3, title: 'Real-time dashboard', desc: 'See expected vs. collected revenue, overdue tenants, and collection progress at a glance' },
                  { icon: Building2, title: 'Multi-property support', desc: 'Manage multiple properties and units from a single account, perfect for growing portfolios' },
                ].map((card) => (
                  <div key={card.title} className="bg-white border border-neutral-200 rounded-2xl p-6 hover:border-blue-600/30 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{card.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Center — Blue panel */}
              <div className="bg-blue-600 rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px] md:min-h-[500px] lg:min-h-0 relative md:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }} />
                <div className="relative z-10 p-6 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white max-w-[280px] mx-auto">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">EasyCollect</h3>
                    <p className="text-white/80 text-sm mb-4">Your rent collection<br />command center</p>
                    <div className="space-y-2 text-left text-sm">
                      <div className="flex items-center gap-2 text-white/90"><Check className="w-4 h-4 text-white" /> Dashboard</div>
                      <div className="flex items-center gap-2 text-white/90"><Check className="w-4 h-4 text-white" /> Invoices</div>
                      <div className="flex items-center gap-2 text-white/90"><Check className="w-4 h-4 text-white" /> Payments</div>
                      <div className="flex items-center gap-2 text-white/90"><Check className="w-4 h-4 text-white" /> Tenants</div>
                      <div className="flex items-center gap-2 text-white/90"><Check className="w-4 h-4 text-white" /> Properties</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="contents lg:flex lg:flex-col gap-5">
                {[
                  { icon: Receipt, title: 'Receipt generation', desc: 'Auto-generate payment receipts that tenants can download or receive via email' },
                  { icon: Shield, title: 'Secure & private', desc: 'Bank-grade security with Supabase. Your data and your tenants\' data stays safe' },
                ].map((card) => (
                  <div key={card.title} className="bg-white border border-neutral-200 rounded-2xl p-6 hover:border-blue-600/30 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{card.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ PRICING TABLE ═══ */}
        <section id="pricing" className="relative py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <div className="grid lg:grid-cols-[0.4fr_0.6fr] gap-12 lg:gap-16 items-start">
              {/* Left side */}
              <div>
                <span className="text-sm text-neutral-500 mb-4 block">Pricing</span>
                <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">Free vs. Pro</h2>
                <p className="text-lg text-neutral-500 leading-relaxed mb-8">
                  Start free and upgrade when you need more. No hidden fees, cancel anytime.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer relative bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {/* Right side — comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left h-12 px-4 font-medium text-neutral-500" />
                      <th className="text-center h-12 px-4 pb-4">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-medium text-neutral-500 mb-1">Free</span>
                          <span className="text-2xl font-bold text-neutral-900">J$0</span>
                        </div>
                      </th>
                      <th className="text-center h-12 px-4 pb-4">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-medium text-neutral-500 mb-1">Pro</span>
                          <span className="text-2xl font-bold text-blue-600">J$3,500</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { feature: 'Tenants', free: 'Up to 5', pro: 'Unlimited', type: 'text' as const },
                      { feature: 'Properties', free: 'Up to 2', pro: 'Unlimited', type: 'text' as const },
                      { feature: 'Invoice generation', free: true, pro: true, type: 'check' as const },
                      { feature: 'Payment links', free: true, pro: true, type: 'check' as const },
                      { feature: 'Proof upload & review', free: true, pro: true, type: 'check' as const },
                      { feature: 'Email reminders', free: true, pro: true, type: 'check' as const },
                      { feature: 'Dashboard & reports', free: true, pro: true, type: 'check' as const },
                      { feature: 'Auto-reminders (daily)', free: false, pro: true, type: 'check' as const },
                      { feature: 'CSV export', free: false, pro: true, type: 'check' as const },
                      { feature: 'Receipt generation', free: false, pro: true, type: 'check' as const },
                      { feature: 'Priority support', free: false, pro: true, type: 'check' as const },
                      { feature: 'Custom branding', free: false, pro: true, type: 'check' as const },
                      { feature: 'Team members', free: false, pro: true, type: 'check' as const },
                    ] as const).map((row) => (
                      <tr key={row.feature} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="p-4 font-medium text-neutral-900">{row.feature}</td>
                        <td className="p-4 text-center">
                          {row.type === 'text' ? (
                            <span className="text-neutral-600">{row.free as string}</span>
                          ) : row.free ? (
                            <Check className="w-5 h-5 text-neutral-900 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-neutral-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.type === 'text' ? (
                            <span className="text-blue-600 font-semibold">{row.pro as string}</span>
                          ) : row.pro ? (
                            <Check className="w-5 h-5 text-blue-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-neutral-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ TESTIMONIALS ═══ */}
        <section id="testimonials" className="relative py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-4">Testimonials</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Results That Speak For<br />Themselves
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-12">
                Join landlords across Jamaica who are collecting rent faster and easier with EasyCollect
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { value: '95%', label: 'faster payments' },
                  { value: '3x', label: 'less time spent' },
                  { value: '100%', label: 'documented proof' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{s.value}</div>
                    <div className="text-sm text-neutral-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Marcus Robinson',
                  role: 'Property Owner, Kingston',
                  initial: 'M',
                  quote: 'I used to chase tenants for weeks. Now I send a link and they pay within days. The payment proof feature means no more arguments about who paid what.',
                },
                {
                  name: 'Shelly-Ann Palmer',
                  role: 'Landlord, Montego Bay',
                  initial: 'S',
                  quote: 'The payment proof feature is brilliant. No more "I already sent it" back and forth — everything is documented and I can approve right from my phone.',
                },
                {
                  name: 'Andre Williams',
                  role: 'Property Manager, Portmore',
                  initial: 'A',
                  quote: 'Managing 12 units used to be a nightmare of spreadsheets. Now I see exactly who paid and who didn\'t from the dashboard. EasyCollect is exactly what I needed.',
                },
                {
                  name: 'Keisha Thompson',
                  role: 'Landlord, Spanish Town',
                  initial: 'K',
                  quote: 'The automatic reminders are a lifesaver. I don\'t have to send awkward messages anymore — EasyCollect handles it professionally.',
                },
                {
                  name: 'Tyrone Mitchell',
                  role: 'Property Owner, Half Way Tree',
                  initial: 'T',
                  quote: 'My tenants love the payment links. They just click, see my bank details, pay, and upload the proof. No app download, no signup needed.',
                },
                {
                  name: 'Davina Richards',
                  role: 'Property Manager, Mandeville',
                  initial: 'D',
                  quote: 'The collection dashboard gives me peace of mind. I can see my expected income vs collected at a glance. Best decision I made for my rental business.',
                },
              ].map((t) => (
                <div key={t.name} className="group bg-white rounded-2xl p-6 border border-neutral-200 hover:border-blue-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="mb-6">
                    {/* Quote mark */}
                    <svg className="w-8 h-8 text-blue-600/30 mb-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-neutral-700 leading-relaxed">{t.quote}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-sm font-medium text-neutral-600">
                      {t.initial}
                    </div>
                    <div>
                      <span className="font-medium text-neutral-900 text-sm">{t.name}</span>
                      <p className="text-xs text-neutral-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-2xl md:text-3xl font-medium text-neutral-900 mb-6">
                Join landlords across Jamaica collecting rent with EasyCollect
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Start Collecting Rent
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FAQ ═══ */}
        <section className="py-24 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto max-w-6xl px-4 w-full">
            <div className="grid md:grid-cols-12 gap-12">
              <div className="md:col-span-4">
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-neutral-900">
                  Frequently Asked<br />Questions
                </h2>
              </div>
              <div className="md:col-span-8">
                <div className="space-y-0">
                  <FAQItem
                    question="How much does EasyCollect cost?"
                    answer="EasyCollect is completely free to use for up to 5 tenants and 2 properties. No monthly fees, no hidden costs. When you're ready to scale, the Pro plan is J$3,500/month for unlimited tenants and properties."
                  />
                  <FAQItem
                    question="Do my tenants need to create an account?"
                    answer="No! That's the beauty of payment links. Your tenant receives a link, opens it in their browser, sees the invoice and your bank details, pays, and uploads proof — all without downloading an app or creating an account."
                  />
                  <FAQItem
                    question="How do payment proofs work?"
                    answer="After your tenant transfers money to your bank account, they upload a screenshot of the confirmation through the payment link. You'll see the proof in your Payments dashboard where you can approve or reject it with one click."
                  />
                  <FAQItem
                    question="Can I manage multiple properties?"
                    answer="Yes! The free plan supports up to 2 properties. With Pro, you get unlimited properties and units, each with their own tenants and invoices — all managed from a single dashboard."
                  />
                  <FAQItem
                    question="How do automatic reminders work?"
                    answer="When enabled, EasyCollect sends daily email reminders to tenants with overdue invoices. Each reminder includes the invoice details, your bank information, and a payment link for easy proof upload."
                  />
                  <FAQItem
                    question="Is my data secure?"
                    answer="Absolutely. EasyCollect uses Supabase with Row Level Security, meaning your data is isolated and protected. All connections are encrypted, and payment proof images are stored in secure cloud storage."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-16 md:py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
              <div className="relative bg-blue-600 rounded-2xl text-center mx-auto overflow-hidden" style={{ minHeight: 400, padding: '80px 40px' }}>
                {/* Noise texture */}
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                }} />

                <div className="relative z-10 flex flex-col items-center gap-8">
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
                    Ready to get started?
                  </h2>
                  <p className="text-base md:text-lg text-white/90 max-w-xl leading-relaxed">
                    Join landlords across Jamaica who use EasyCollect to send invoices, collect proof of payment, and track their rental income — all for free.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-neutral-100 transition-colors shadow-lg cursor-pointer"
                    >
                      Create free account
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      Log in
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-white/80">
                    <div className="flex -space-x-2">
                      {['MR', 'SP', 'AW', 'KT'].map((initials) => (
                        <div key={initials} className="w-8 h-8 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {initials}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm">Trusted by landlords across Jamaica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="w-full overflow-hidden relative z-50 bg-white border-x border-neutral-200 max-w-7xl mx-auto">
        <div className="bg-[#1a3a5c] text-white">
          <div className="container mx-auto px-6 pt-16 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-semibold text-lg">EasyCollect</span>
                </div>
                <p className="text-sm text-white/60 mb-6">
                  Collect rent simply.<br />Get paid on time.
                </p>
                <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} EasyCollect</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</a></li>
                  <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</a></li>
                  <li><a href="#how-it-works" className="text-white/60 hover:text-white transition-colors text-sm">How It Works</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Company</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">About</a></li>
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Legal</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Terms</a></li>
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacy</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">For Landlords</h3>
                <ul className="space-y-3">
                  <li><Link to="/signup" className="text-white/60 hover:text-white transition-colors text-sm">Sign Up</Link></li>
                  <li><Link to="/login" className="text-white/60 hover:text-white transition-colors text-sm">Log In</Link></li>
                </ul>
              </div>
            </div>

            <div className="max-w-3xl mx-auto text-center mb-8">
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="text-blue-400 font-semibold">EasyCollect</span> was created to simplify rent collection for landlords and property managers across Jamaica. Our mission is to remove the friction from getting paid — making it simple to send invoices, receive proof of payment, and track your rental income.
              </p>
            </div>
          </div>

          {/* Giant watermark text */}
          <div className="relative w-full overflow-hidden">
            <div className="text-[20vw] md:text-[18vw] font-bold text-white/[0.04] whitespace-nowrap text-center leading-none select-none pointer-events-none -mb-[4vw]">
              EasyCollect
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
