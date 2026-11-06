import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SEO from '@/components/SEO';
import BrandLogo from '@/components/BrandLogo';
import { RentFlow, LoanStrip, FeatureShowcase, LouvreLegend } from '@/components/landing/Visuals';
import { ShieldCheck, Landmark, Lock } from 'lucide-react';
import { LedgerDemo, DEMO_ROWS, type DemoStatus } from '@/components/landing/LedgerDemo';
import type { FlatState } from '@/components/landing/KingstonScene';
import { cn } from '@/lib/utils';

const wrap = 'mx-auto max-w-[1180px] px-4 sm:px-8 lg:px-11';

// Three.js loads in its own chunk after the page has painted; a poster stands in until then
const KingstonScene = lazy(() => import('@/components/landing/KingstonScene'));

/** The sample building before anyone touches the demo: flats 4 and 6 late, flat 3 due soon. */
const BASE_FLATS: Record<number, FlatState> = { 1: 'paid', 2: 'paid', 3: 'due', 4: 'late', 5: 'paid', 6: 'late' };

/**
 * The landing page sits on limestone rather than the app's warm ground: cooler,
 * mineral, closer to the concrete and louvres the direction comes from.
 */
const limestone = {
  '--color-ground': '#ECEFEA',
  '--color-rule': '#D2D8D0',
} as CSSProperties;

/** On the green field: light focus ring, light selection. */
const onShell = 'bg-shell text-white [&_:focus-visible]:outline-shell-ink selection:bg-shell-ink selection:text-shell';

/** The primary action on green, light so it is the brightest thing on the field. */
const onGreenPrimary =
  'inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[3px] border border-[#ECEFEA] bg-[#ECEFEA] px-5 text-[15px] font-medium text-shell transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white hover:bg-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2';

function Shot({ src, width, height, alt, className }: {
  src: string; width: number; height: number; alt: string; className?: string;
}) {
  return (
    <figure className={className}>
      <img src={src} width={width} height={height} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full border border-white/20" />
      <figcaption className="mt-2 text-[13px] text-shell-ink">Sample data</figcaption>
    </figure>
  );
}

const faqs: [string, string][] = [
  ['Do my tenants need an account or an app?', 'No. They get a link, open it in the browser on any phone, see the amount and your bank details, and send their screenshot from there. You can email the link from EasyCollect or copy it into WhatsApp.'],
  ['How does proof of payment work?', 'After paying, the tenant uploads a screenshot of the bank confirmation through their link. You see it under Payments, check it against your account, then approve or reject it. Approving records the payment and emails the tenant a receipt.'],
  ['Can I track loans as well as rent?', 'Yes. Add a borrower, set the amount, interest and term, and EasyCollect lays out the repayment schedule. Record repayments as they come in and you always see what is left and what is late.'],
  ['What happens when Pro arrives?', 'We will tell you what it costs before anything changes. Your records stay yours either way, and you can export them.'],
];

export default function Landing() {
  const [status, setStatus] = useState<Record<string, DemoStatus>>({});
  const [sceneReady, setSceneReady] = useState(false);
  const flats = useMemo(() => {
    const f = { ...BASE_FLATS };
    for (const r of DEMO_ROWS) if (r.flat && status[r.id] === 'paid') f[r.flat] = 'paid';
    return f;
  }, [status]);

  return (
    <div style={limestone} className="min-h-screen bg-ground text-ink selection:bg-shell selection:text-white [&_h1]:text-balance [&_h2]:text-balance [&_p]:text-pretty [&_dd]:text-pretty [&_li]:text-pretty">
      <SEO path="/" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-popover focus:p-2">Skip to content</a>

      {/* The green field: the app's rail colour, opened out to carry the offer */}
      <div className={onShell}>
        <header className={cn(wrap, 'flex h-16 items-center justify-between gap-4')}>
          <Link to="/" className="text-[22px] text-white"><BrandLogo /></Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2 text-sm">
            <a href="#how" className="hidden px-3 py-2 text-shell-ink underline-offset-4 hover:text-white hover:underline md:block">How it works</a>
            <a href="#facts" className="hidden px-3 py-2 text-shell-ink underline-offset-4 hover:text-white hover:underline md:block">Price</a>
            <a href="#questions" className="hidden px-3 py-2 text-shell-ink underline-offset-4 hover:text-white hover:underline md:block">Questions</a>
            <Link to="/login" className="px-3 py-2 text-shell-ink underline-offset-4 hover:text-white hover:underline">Log in</Link>
            <Link to="/signup" className="ml-1 inline-flex h-9 items-center rounded-[3px] bg-[#ECEFEA] px-4 font-medium text-shell transition-colors duration-150 hover:bg-white">
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create a free account</span>
            </Link>
          </nav>
        </header>

        <section className={cn(wrap, 'grid items-center gap-8 pb-10 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4 lg:pb-12 lg:pt-8')}>
          <div className="lg:pb-8">
            <h1 className="display text-[48px] font-medium leading-[1] tracking-[-0.02em] sm:text-[72px] sm:tracking-[-0.03em] lg:text-[76px]">
              <span className="block">Stop chasing</span>
              <span className="block text-shell-ink">Start collecting</span>
            </h1>
            <p className="mt-6 max-w-[30ch] text-[18px] leading-snug text-shell-ink sm:mt-8 sm:text-[20px]">
              Rent and loans in Jamaica, tracked and chased for you.
            </p>
            <div className="mt-8 flex flex-col gap-x-5 gap-y-3 sm:flex-row sm:items-center">
              <Link to="/signup" className={onGreenPrimary}>Create a free account</Link>
              <p className="text-[14px] text-shell-ink">Free for now</p>
            </div>
          </div>

          <figure className="lg:-mr-11">
            <div className="relative h-[320px] sm:h-[460px] lg:h-[600px]">
              <img
                src="/screens/kingston-poster.webp"
                alt=""
                aria-hidden="true"
                width={1344}
                height={1200}
                decoding="async"
                fetchPriority="high"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                className={cn('absolute inset-0 h-full w-full object-contain transition-opacity duration-500', sceneReady && 'opacity-0')}
              />
              <Suspense fallback={null}>
                <KingstonScene flats={flats} onReady={() => setSceneReady(true)} className="absolute inset-0" />
              </Suspense>
            </div>
            <figcaption className="mt-2 flex justify-center text-shell-ink lg:justify-end lg:pr-11">
              <LouvreLegend />
            </figcaption>
          </figure>
        </section>
      </div>

      <main id="main">
        {/* The product itself, working, on the page */}
        <section aria-labelledby="today" className={cn(wrap, 'pb-16 pt-10 sm:pt-14 lg:pb-24')}>
          <h2 id="today" className="mb-6 text-[15px] font-medium">Your Today page. Press Mark paid and watch the building</h2>
          <LedgerDemo status={status} setStatus={setStatus} />
        </section>

        <section id="how" aria-labelledby="how-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'py-16 lg:py-24')}>
            <h2 id="how-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">Rent, collected in three steps</h2>
            <div className="mt-10"><RentFlow /></div>
            <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-11">
              <h3 className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">Loans, month by month</h3>
              <LoanStrip />
            </div>
          </div>
        </section>

        {/* The tenant's side, back on the green */}
        <section aria-labelledby="tenant-h" className={onShell}>
          <div className={cn(wrap, 'grid items-center gap-12 py-16 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-24 lg:py-24')}>
            <div>
              <h2 id="tenant-h" className="display max-w-[14ch] text-[40px] font-medium leading-[1] sm:text-[48px]">No account, no app, any phone</h2>
              <p className="mt-5 max-w-[34ch] text-[17px] text-shell-ink">They open the link, pay, and send the screenshot.</p>
            </div>
            <Shot
              src="/screens/pay-phone.webp"
              width={780}
              height={2088}
              alt="The payment page a tenant sees on a phone: the amount due, the landlord's bank details, and a button to add a screenshot of the payment."
              className="mx-auto w-full max-w-[300px] md:max-w-none"
            />
          </div>
        </section>

        <section aria-labelledby="else-h">
          <div className={cn(wrap, 'py-16 lg:py-24')}>
            <h2 id="else-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">And it keeps going without you</h2>
            <div className="mt-10"><FeatureShowcase /></div>
          </div>
        </section>

        <section id="facts" aria-labelledby="price-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'grid items-end gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-11 lg:py-24')}>
            <div>
              <h2 id="price-h" className="sr-only">Price</h2>
              <p className="display num text-[96px] font-medium leading-none tracking-[-0.03em] sm:text-[128px]">J$0</p>
              <p className="mt-3 text-[17px]">Free for now. No card needed.</p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {([[Landmark, 'Money goes straight to your bank'], [ShieldCheck, 'Only you see your records'], [Lock, 'Encrypted end to end']] as const).map(([Icon, text]) => (
                <li key={text} className="border-t border-rule pt-4">
                  <Icon aria-hidden="true" className="h-6 w-6 text-shell" strokeWidth={1.5} />
                  <p className="mt-3 text-[16px] font-medium">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="questions" aria-labelledby="q-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'grid gap-8 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-11 lg:py-24')}>
            <div>
              <h2 id="q-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">Questions</h2>

            </div>
            <div className="border-b border-rule">
              {faqs.map(([q, a]) => (
                <details key={q} className="group border-t border-rule">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-quiet transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180" strokeWidth={1.5} />
                  </summary>
                  <p className="max-w-[60ch] pb-5 text-[16px] text-quiet">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Ends on the green it started on */}
      <footer className={onShell}>
        <div className={cn(wrap, 'py-16 lg:py-24')}>
          <p className="display max-w-[16ch] text-[40px] font-medium leading-[1] sm:text-[56px]">Start with one tenant or one loan</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link to="/signup" className={onGreenPrimary}>Create a free account</Link>
            <Link to="/login" className="text-[15px] font-medium text-white underline underline-offset-4">Log in</Link>
          </div>
        </div>
        <div className={cn(wrap, 'flex flex-col gap-4 border-t border-white/15 py-8 text-[14px] text-shell-ink sm:flex-row sm:items-center sm:justify-between')}>
          <p><span className="font-medium text-white">EasyCollect</span> &copy; {new Date().getFullYear()}. Collect anything, easily.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white hover:underline">Terms of Service</Link>
            <a href="mailto:support@easycollectja.com" className="hover:text-white hover:underline">support@easycollectja.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
