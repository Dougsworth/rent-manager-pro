import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BrandLogo from '@/components/BrandLogo';
import { RotatingWord } from '@/components/RotatingWord';
import { ArrowRight, Check, CheckCircle, Minus, Plus } from 'lucide-react';

const landingStyles = `
.reveal {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 400ms cubic-bezier(0.22,1,0.36,1), transform 400ms cubic-bezier(0.22,1,0.36,1);
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
`;

const btnBase = 'inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';
const btnAccent = `${btnBase} bg-blue-600 text-white hover:bg-blue-700`;
const btnInk = `${btnBase} bg-neutral-900 text-white hover:bg-neutral-800`;
const btnQuiet = `${btnBase} border border-neutral-300 text-neutral-900 hover:bg-neutral-50`;
const sectionTitle = 'text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 leading-tight';
const container = 'mx-auto w-full max-w-6xl px-6 lg:px-8';

/* Reveal on scroll */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* Animated counter */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.round(eased * value);
            el.textContent = `${start}${suffix}`;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* One ledger line: label on the left, figure on the right, a hairline underneath */
function LedgerRow({ label, value, strong = false, tone = 'text-neutral-900' }: { label: string; value: React.ReactNode; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-neutral-200 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={`tabular-nums ${strong ? 'text-xl font-medium' : 'text-sm'} ${tone}`}>{value}</span>
    </div>
  );
}

/* One feature in the features table */
function Feature({ title, desc, children, className = '' }: { title: string; desc: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-6 md:p-8 flex flex-col gap-8 ${className}`}>
      <div className="flex-1">{children}</div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">{desc}</p>
        </div>
        <Link to="/signup" className="text-sm text-blue-700 hover:text-blue-800 transition-colors flex-shrink-0">
          Try free
        </Link>
      </div>
    </div>
  );
}

/* How it works */
function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Create and send invoice',
      desc: 'Generate an invoice with one click. Each tenant gets auto-numbered invoices. Share the payment link via WhatsApp, email or text.',
    },
    {
      step: '02',
      title: 'Tenant pays and uploads proof',
      desc: 'Tenant opens the link on any device, with no app and no signup. They see your bank details, pay and upload a screenshot as proof.',
    },
    {
      step: '03',
      title: 'Approve and track',
      desc: 'Review the proof and approve with one click. Watch your collection rate climb on the dashboard. Every payment documented.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white border-t border-neutral-200">
      <div className={container}>
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
            <div className="max-w-2xl">
              <h2 className={`${sectionTitle} mb-4`}>Get paid in 3 simple steps</h2>
              <p className="text-lg text-neutral-500">
                Create an invoice, share the link and approve the proof. Start collecting rent in minutes, not days.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/signup" className={btnInk}>Get started</Link>
              <a href="#pricing" className={btnQuiet}>View plans</a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <ol className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((item) => (
              <li key={item.step} className="border-t border-neutral-900 pt-4">
                <span className="block font-mono text-sm text-neutral-500 tabular-nums mb-8 md:mb-12">{item.step}</span>
                <h3 className="text-xl font-medium text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* FAQ item */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full py-6 flex justify-between items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
      >
        <span className="text-base md:text-lg font-medium text-neutral-900 pr-4">{question}</span>
        <span className="flex-shrink-0 text-neutral-500">
          {open ? <Minus className="w-4 h-4" strokeWidth={1.5} /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
        </span>
      </button>
      {open && (
        <div className="pb-6 pr-4 sm:pr-12">
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

function PlanItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-neutral-700">
      <Check className="w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0" strokeWidth={1.5} />
      <span>{children}</span>
    </li>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <SEO
        title="Rent Collection & Loan Tracking Made Easy for Jamaicans"
        description="Jamaica's #1 collection platform. Track rent and personal loans, send invoices, automate reminders, and manage borrowers — all in one place. Start free today."
        keywords="rent collection Jamaica, collect rent online, Jamaican landlord software, rent management, tenant management, invoice tenants, rent payment app, property management Jamaica, EasyCollect, easy rent collect, easycollectja, landlord app Jamaica, rental property management, rent tracker, online rent payment Jamaica, loan tracking Jamaica, personal loan management, track money lent"
        path="/"
      />
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className={`${container} h-16 flex items-center justify-between`}>
          <Link to="/" className="flex items-center flex-shrink-0">
            <BrandLogo className="text-lg font-semibold text-neutral-900" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Plans</a>
            <a href="#testimonials" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section className="pt-28 md:pt-40 pb-20 md:pb-28 bg-white">
          <div className={container}>
            <div className="grid md:grid-cols-12 gap-12 md:gap-8 items-center">
              <div className="md:col-span-7">
                <Reveal>
                  <p className="text-sm text-neutral-500 mb-6">Built for collecting in Jamaica</p>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-neutral-900 leading-[1.06] tracking-tight mb-6">
                    The easiest way to<br />collect <RotatingWord className="text-blue-700" /> &amp; more
                  </h1>
                  <p className="text-lg text-neutral-600 max-w-xl mb-8 leading-relaxed">
                    Collect rent and loan payments, send invoices, share payment links, receive proof of payment, automate reminders, manage tenants and borrowers, and track it all with reports. One platform built for Jamaican landlords and lenders.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                    <Link to="/signup" className={btnAccent}>Get started free</Link>
                    <a href="#how-it-works" className={btnQuiet}>See how it works</a>
                  </div>
                  <p className="text-sm text-neutral-500">Start free. No credit card required</p>
                </Reveal>
              </div>

              {/* The invoice a tenant actually receives */}
              <div className="md:col-span-5">
                <Reveal delay={60}>
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 md:p-8">
                    <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-neutral-900">
                      <p className="text-lg font-medium text-neutral-900">Monthly rent</p>
                      <p className="font-mono text-sm text-neutral-500">INV-ARB-003</p>
                    </div>
                    <LedgerRow label="Amount" value="J$85,000" strong />
                    <LedgerRow label="Due" value="Feb 28, 2026" />
                    <LedgerRow label="Status" value="Unpaid" tone="text-amber-700" />
                    <LedgerRow label="Bank" value="NCB Jamaica" />
                    <LedgerRow label="Account" value="Property Mgmt Ltd" />
                    <div className="mt-4 h-11 rounded-lg bg-neutral-900 text-white text-sm font-medium flex items-center justify-center">
                      Upload proof
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Landlord story */}
            <Reveal delay={60} className="hidden md:block">
              <div className="grid grid-cols-12 gap-8 items-end mt-20 pt-8 border-t border-neutral-200">
                <div className="col-span-7">
                  <img
                    src="/leroy_skalstad-man-4333898_1280.jpg"
                    alt="Landlord collecting rent"
                    className="w-full h-96 object-cover rounded-xl"
                  />
                </div>
                <div className="col-span-5">
                  <p className="text-sm text-neutral-500 mb-4">Getting paid since 2024</p>
                  <p className="text-3xl font-medium text-neutral-900 leading-tight tracking-tight mb-4">
                    &ldquo;No more chasing tenants for payment.&rdquo;
                  </p>
                  <p className="text-sm text-neutral-900 mb-6">
                    Marcus R. <span className="text-neutral-500">Kingston, JA</span>
                  </p>
                  <LedgerRow label="Units" value="12" />
                  <LedgerRow label="Collection rate" value="95%" />
                  <LedgerRow label="Per month" value="J$1.2M" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 md:py-28 bg-white border-t border-neutral-200">
          <div className={container}>
            <Reveal>
              <div className="max-w-2xl mb-12 md:mb-16">
                <h2 className={`${sectionTitle} mb-4`}>Everything you need to get paid</h2>
                <p className="text-lg text-neutral-500">
                  Send invoices, track rent and loan payments, automate reminders and manage your entire collection from one simple dashboard.
                </p>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
                <Feature
                  className="md:col-span-7"
                  title="Automatic invoicing"
                  desc="Generate invoices with auto-numbering per tenant. Track every dollar owed, per tenant, per month."
                >
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <div>
                      <p className="font-mono text-sm text-neutral-900 pb-2 border-b border-neutral-900">INV-ARB-003</p>
                      <LedgerRow label="Amount" value="J$85,000" />
                      <LedgerRow label="Due" value="Feb 28" />
                      <LedgerRow label="Status" value="Pending" tone="text-amber-700" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-mono text-sm text-neutral-900 pb-2 border-b border-neutral-900">INV-ARB-004</p>
                      <LedgerRow label="Amount" value="J$65,000" />
                      <LedgerRow label="Due" value="Mar 1" />
                      <LedgerRow label="Status" value="Paid" tone="text-green-700" />
                    </div>
                  </div>
                </Feature>

                <Feature
                  className="md:col-span-5"
                  title="Track revenue and payouts"
                  desc="See expected vs. collected revenue at a glance from your dashboard."
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-neutral-500">Collections</span>
                    <span className="text-sm text-neutral-500">Feb 2026</span>
                  </div>
                  <p className="text-3xl font-medium text-neutral-900 tabular-nums mb-1">J$680,000</p>
                  <p className="text-sm text-neutral-500 mb-6"><span className="text-green-700">+12.5%</span> from last period</p>
                  <div className="h-16 flex items-end gap-1">
                    {[35, 45, 30, 55, 40, 65, 50, 70, 60, 80, 75, 85].map((h, i, all) => (
                      <div key={i} className={`flex-1 rounded-sm ${i === all.length - 1 ? 'bg-blue-600' : 'bg-neutral-200'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </Feature>

                <Feature
                  className="md:col-span-5"
                  title="Proof of payment upload"
                  desc="Tenants upload proof of their bank transfers. Review, approve or reject with one click."
                >
                  <p className="flex items-center gap-2 text-sm text-green-700 mb-2">
                    <CheckCircle className="w-4 h-4" strokeWidth={1.5} /> Payment verified
                  </p>
                  <p className="text-3xl font-medium text-neutral-900 tabular-nums mb-4">J$85,000</p>
                  <LedgerRow label="Invoice" value={<span className="font-mono">INV-ARB-003</span>} />
                  <LedgerRow label="Payment date" value="22 Feb 2026" />
                  <LedgerRow label="Method" value="Bank transfer" />
                </Feature>

                <Feature
                  className="md:col-span-7"
                  title="Shareable payment links"
                  desc="Each invoice gets a unique link where tenants view details and upload proof. No account needed."
                >
                  <p className="font-mono text-sm text-neutral-500 pb-3 border-b border-neutral-900 truncate">easycollect.com/pay/a3f8-b2c1...</p>
                  <LedgerRow label="Monthly rent, Feb 2026" value="J$85,000" strong />
                  <LedgerRow label="Due" value="Feb 28" />
                  <div className="flex items-center gap-6 pt-4 text-sm">
                    <span className="text-neutral-900 underline underline-offset-4 decoration-neutral-300">View details</span>
                    <span className="text-neutral-900 underline underline-offset-4 decoration-neutral-300">Upload proof</span>
                  </div>
                </Feature>
              </div>
            </Reveal>
          </div>
        </section>

        <HowItWorks />

        {/* Dashboard */}
        <section className="py-20 md:py-28 bg-neutral-950 text-white">
          <div className={container}>
            <Reveal>
              <div className="grid md:grid-cols-12 gap-8 mb-12 md:mb-16">
                <div className="md:col-span-7">
                  <p className="text-sm text-neutral-400 mb-4">Your command center</p>
                  <h2 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight">
                    Manage properties, tenants and payments from anywhere
                  </h2>
                </div>
                <div className="md:col-span-5 md:pt-9">
                  <p className="text-base text-neutral-400 leading-relaxed mb-6">
                    Your dashboard shows everything at a glance: expected revenue, collection progress, overdue tenants and recent payments. No spreadsheets needed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/signup" className={`${btnBase} bg-white text-neutral-900 hover:bg-neutral-200`}>Start for free</Link>
                    <a href="#features" className={`${btnBase} border border-white/20 text-white hover:bg-white/10`}>Explore features</a>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={60}>
              {/* Product view */}
              <div className="bg-white text-neutral-900 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-6 md:px-8 py-4 border-b border-neutral-200">
                  <div>
                    <h3 className="text-sm font-medium">Dashboard</h3>
                    <p className="text-sm text-neutral-500">February 2026</p>
                  </div>
                  <span className="font-mono text-sm text-neutral-500 truncate hidden sm:block">app.easycollect.com/dashboard</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 border-b border-neutral-200">
                  {[
                    { label: 'Expected', value: 'J$840,000', change: null, tone: 'text-neutral-900' },
                    { label: 'Collected', value: 'J$680,000', change: '+12.5% from last month', tone: 'text-neutral-900' },
                    { label: 'Outstanding', value: 'J$160,000', change: null, tone: 'text-neutral-900' },
                    { label: 'Overdue', value: '2 tenants', change: '-1 from last month', tone: 'text-red-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white p-4 md:px-8 md:py-6">
                      <p className="text-sm text-neutral-500 mb-2">{s.label}</p>
                      <p className={`text-lg md:text-2xl font-medium tabular-nums ${s.tone}`}>{s.value}</p>
                      {s.change && <p className="text-xs text-neutral-500 mt-1">{s.change}</p>}
                    </div>
                  ))}
                </div>

                <div className="hidden md:grid grid-cols-3 border-b border-neutral-200">
                  <div className="col-span-2 p-8 border-r border-neutral-200">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-medium">Monthly collections</span>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-300" /> Collected</span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-100 border border-neutral-200" /> Expected</span>
                      </div>
                    </div>
                    <div className="h-40 flex items-end gap-2">
                      {[72, 85, 65, 88, 78, 90, 70, 82, 75, 86, 80, 81].map((c, i, all) => (
                        <div key={i} className="flex-1 h-[90%] flex flex-col justify-end bg-neutral-100 rounded-sm overflow-hidden">
                          <div className={`w-full ${i === all.length - 1 ? 'bg-blue-600' : 'bg-neutral-300'}`} style={{ height: `${(c / 90) * 100}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-sm font-medium mb-2">Recent activity</p>
                    {[
                      { name: 'Marcus R.', action: 'Paid', amount: 'J$85,000', time: '2h ago' },
                      { name: 'Keisha T.', action: 'Proof uploaded', amount: 'J$65,000', time: '5h ago' },
                      { name: 'Andre W.', action: 'Overdue', amount: 'J$72,000', time: '1d ago' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-baseline justify-between gap-4 py-3 border-b border-neutral-200 last:border-b-0">
                        <div className="min-w-0">
                          <p className="text-sm truncate">{item.name}</p>
                          <p className="text-xs text-neutral-500">{item.action}, {item.time}</p>
                        </div>
                        <span className="text-sm tabular-nums">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 md:px-8 py-6">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-sm text-neutral-500">Collection rate</span>
                    <span className="text-lg font-medium tabular-nums">81%</span>
                  </div>
                  <div className="flex h-2 gap-0.5 rounded-sm overflow-hidden">
                    <div className="bg-blue-600" style={{ width: '81%' }} />
                    <div className="bg-neutral-400" style={{ width: '9%' }} />
                    <div className="bg-neutral-200" style={{ width: '10%' }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-blue-600" />Collected</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-400" />Pending</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-200" />Outstanding</span>
                  </div>
                </div>
              </div>

              {/* What is included, set as plain text */}
              <ul className="grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-3 mt-8 text-sm text-neutral-400">
                {['Real-time dashboard', 'Multi-property', 'Auto receipts', 'Bank-grade security', 'Auto reminders', 'Payment links'].map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 md:py-28 bg-white">
          <div className={container}>
            <Reveal>
              <div className="max-w-2xl mb-12 md:mb-16">
                <p className="text-sm text-neutral-500 mb-4">Pricing</p>
                <h2 className={`${sectionTitle} mb-4`}>Simple, transparent pricing</h2>
                <p className="text-lg text-neutral-500">
                  Start free and upgrade when you need more. No hidden fees, cancel anytime.
                </p>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="grid md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
                {/* Free plan */}
                <div className="bg-white p-6 md:p-8 flex flex-col">
                  <p className="text-sm text-neutral-500">Free</p>
                  <p className="mt-2 mb-3 flex items-baseline gap-1">
                    <span className="text-4xl font-medium tabular-nums">J$0</span>
                    <span className="text-sm text-neutral-500">/month</span>
                  </p>
                  <p className="text-sm text-neutral-500 mb-8">Perfect for landlords just getting started with a few tenants.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Up to 5 tenants', 'Up to 2 properties', 'Invoice generation', 'Loan tracking', 'Payment links', 'Proof upload and review', 'Email reminders', 'Dashboard and reports'].map((f) => (
                      <PlanItem key={f}>{f}</PlanItem>
                    ))}
                  </ul>
                  <Link to="/signup" className={btnQuiet}>Get started free</Link>
                </div>

                {/* Pro plan */}
                <div className="bg-white p-6 md:p-8 flex flex-col">
                  <p className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-neutral-900">Pro</span>
                    <span className="text-neutral-500">Most popular</span>
                  </p>
                  <p className="mt-2 mb-3 flex items-baseline gap-1">
                    <span className="text-4xl font-medium tabular-nums">J$3,500</span>
                    <span className="text-sm text-neutral-500">/month</span>
                  </p>
                  <p className="text-sm text-neutral-500 mb-8">For growing landlords and lenders who need unlimited tenants, properties and loans.</p>
                  <ul className="space-y-3 mb-4">
                    {['Unlimited tenants', 'Unlimited properties', 'Unlimited loans'].map((f) => (
                      <PlanItem key={f}>{f}</PlanItem>
                    ))}
                  </ul>
                  <p className="text-sm font-medium text-neutral-900 pt-4 mb-4 border-t border-neutral-200">Everything in Free, plus</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Auto-reminders (daily)', 'CSV export', 'Receipt generation', 'Priority support', 'Custom branding', 'Team members'].map((f) => (
                      <PlanItem key={f}>{f}</PlanItem>
                    ))}
                  </ul>
                  <Link to="/signup" className={btnAccent}>Upgrade to Pro</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 md:py-28 bg-neutral-50 border-y border-neutral-200">
          <div className={container}>
            <Reveal>
              <div className="max-w-2xl mb-12 md:mb-16">
                <p className="text-sm text-neutral-500 mb-4">Testimonials</p>
                <h2 className={`${sectionTitle} mb-4`}>Results that speak for themselves</h2>
                <p className="text-lg text-neutral-500">
                  Join landlords and lenders across Jamaica who are getting paid faster and easier with EasyCollect
                </p>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
                {[
                  { val: 95, suf: '%', label: 'faster payments' },
                  { val: 3, suf: 'x', label: 'less time spent' },
                  { val: 100, suf: '%', label: 'documented proof' },
                ].map((s) => (
                  <div key={s.label} className="border-t border-neutral-900 pt-4">
                    <div className="text-3xl md:text-5xl font-medium tabular-nums tracking-tight mb-1"><Counter value={s.val} suffix={s.suf} /></div>
                    <div className="text-sm text-neutral-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <figure className="max-w-3xl mb-12 md:mb-16">
                <blockquote className="text-xl md:text-3xl font-medium leading-snug tracking-tight text-neutral-900">
                  &ldquo;I used to chase tenants for weeks. Now I send a link and they pay within minutes. The payment proof feature means no more arguments about who paid what.&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-8">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face&auto=format&q=80"
                    alt="Marcus Robinson"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="block text-sm font-medium text-neutral-900">Marcus Robinson</span>
                    <span className="block text-sm text-neutral-500">Property Owner, Kingston</span>
                  </div>
                </figcaption>
              </figure>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {[
                  {
                    name: 'Shelly-Ann Palmer',
                    role: 'Landlord, Montego Bay',
                    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'The payment proof feature is brilliant. No more "I already sent it" back and forth — everything is documented.',
                  },
                  {
                    name: 'Andre Williams',
                    role: 'Property Manager, Portmore',
                    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'Managing 12 units used to be a nightmare of spreadsheets. Now I see exactly who paid and who didn\'t.',
                  },
                  {
                    name: 'Keisha Thompson',
                    role: 'Landlord, Spanish Town',
                    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'The automatic reminders are a lifesaver. I don\'t have to send awkward messages anymore.',
                  },
                  {
                    name: 'Tyrone Mitchell',
                    role: 'Property Owner, Half Way Tree',
                    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'My tenants love the payment links. They just click, see my bank details, pay, and upload the proof. No app needed.',
                  },
                  {
                    name: 'Davina Richards',
                    role: 'Property Manager, Mandeville',
                    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'I can see my expected income vs collected at a glance. Best decision I made for my rental business.',
                  },
                ].map((t) => (
                  <figure key={t.name} className="border-t border-neutral-200 pt-4 flex flex-col justify-between gap-4">
                    <blockquote className="text-sm text-neutral-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="flex items-center gap-3">
                      <img src={t.photo} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="block text-sm text-neutral-900">{t.name}</span>
                        <span className="block text-xs text-neutral-500">{t.role}</span>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="mt-12">
                <Link to="/signup" className={btnInk}>
                  Start collecting rent
                  <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28 bg-white">
          <div className={container}>
            <Reveal>
              <div className="grid md:grid-cols-12 gap-12">
                <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                  <h2 className={`${sectionTitle} mb-4`}>Frequently asked questions</h2>
                  <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                    Can&apos;t find what you&apos;re looking for? Reach out to our team and we&apos;ll get back to you.
                  </p>
                  <a href="mailto:support@easycollect.com" className="text-sm text-blue-700 hover:text-blue-800 transition-colors">
                    Contact support
                  </a>
                </div>
                <div className="md:col-span-8 border-t border-neutral-200">
                  <FAQItem
                    question="How much does EasyCollect cost?"
                    answer="EasyCollect is completely free to use for up to 5 tenants and 2 properties. No monthly fees, no hidden costs. When you're ready to scale, the Pro plan is J$3,500/month for unlimited tenants and properties."
                  />
                  <FAQItem
                    question="Do my tenants need to create an account?"
                    answer="No. Your tenant receives a payment link, opens it in their browser, sees the invoice and your bank details, pays and uploads proof, all without downloading an app or creating an account."
                  />
                  <FAQItem
                    question="How do payment proofs work?"
                    answer="After your tenant transfers money to your bank account, they upload a screenshot of the confirmation through the payment link. You'll see the proof in your Payments dashboard where you can approve or reject it with one click."
                  />
                  <FAQItem
                    question="Can I manage multiple properties?"
                    answer="Yes. The free plan supports up to 2 properties. With Pro, you get unlimited properties and units, each with their own tenants and invoices, all managed from a single dashboard."
                  />
                  <FAQItem
                    question="How do automatic reminders work?"
                    answer="When enabled, EasyCollect sends daily email reminders to tenants with overdue invoices. Each reminder includes the invoice details, your bank information, and a payment link for easy proof upload."
                  />
                  <FAQItem
                    question="Is my data secure?"
                    answer="EasyCollect uses Supabase with Row Level Security, meaning your data is isolated and protected. All connections are encrypted, and payment proof images are stored in secure cloud storage."
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 bg-white border-t border-neutral-200">
          <div className={container}>
            <Reveal>
              <div className="max-w-2xl">
                <h2 className={`${sectionTitle} mb-4`}>Ready to get started?</h2>
                <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                  Join landlords and lenders across Jamaica who use EasyCollect to send invoices, collect proof of payment and track their income, all for free.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                  <Link to="/signup" className={btnAccent}>Create free account</Link>
                  <Link to="/login" className={btnQuiet}>Log in</Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 flex-shrink-0">
                    {[
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                    ].map((src, i) => (
                      <img key={i} src={src} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-500">Trusted by landlords and lenders across Jamaica</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 text-white">
        <div className={`${container} pt-12 md:pt-16 pb-8`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <BrandLogo className="text-lg font-semibold" coinColor="rgba(255,255,255,0.8)" />
              </div>
              <p className="text-sm text-neutral-400">
                Track rent &amp; loans simply.<br />Get paid on time
              </p>
            </div>

            {[
              { title: 'Product', links: [['Features', '#features'], ['Pricing', '#pricing'], ['How it works', '#how-it-works']] },
              { title: 'Company', links: [['About', '#'], ['Contact', '#']] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="text-sm text-neutral-500 mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href} className="text-sm text-neutral-300 hover:text-white transition-colors">{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            {[
              { title: 'Legal', links: [['Terms', '/terms'], ['Privacy', '/privacy']] },
              { title: 'Get started', links: [['Sign up', '/signup'], ['Log in', '/login']] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="text-sm text-neutral-500 mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map(([label, to]) => (
                    <li key={label}><Link to={to} className="text-sm text-neutral-300 hover:text-white transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 grid md:grid-cols-12 gap-4">
            <p className="md:col-span-8 text-sm text-neutral-400 leading-relaxed">
              EasyCollect was created to simplify rent collection and loan tracking for landlords, property managers and lenders across Jamaica. Our mission is to remove the friction from getting paid, making it simple to send invoices, manage loans, receive proof of payment and track your income.
            </p>
            <p className="md:col-span-4 md:text-right text-sm text-neutral-500">&copy; {new Date().getFullYear()} EasyCollect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
