import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react';
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

/** Fades each .m-pop in as it scrolls into view, staggered by --d. */
function useReveal() {
  useEffect(() => {
    const stages = document.querySelectorAll('.m-pop');
    if (!('IntersectionObserver' in window)) {
      stages.forEach((el) => el.classList.add('m-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('m-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px' });
    stages.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing() {
  useReveal();
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

      {/* Full screen scene: the block in a Kingston morning, the offer over it */}
      <div className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-[#c5d3d3] text-white h-[100svh] max-h-[900px] [&_:focus-visible]:outline-white">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img
            src="/screens/kingston-hero.webp"
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', sceneReady && 'opacity-0')}
          />
          <Suspense fallback={null}>
            <KingstonScene variant="hero" flats={flats} onReady={() => setSceneReady(true)} className="absolute inset-0" />
          </Suspense>
          {/* Shade under the words so they read on any part of the sky */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,32,26,.55)_0%,rgba(9,32,26,.1)_45%,rgba(9,32,26,.35)_100%)] lg:bg-[linear-gradient(90deg,rgba(9,32,26,.62)_0%,rgba(9,32,26,.25)_40%,rgba(9,32,26,0)_65%)]" />
          {/* Top and bottom shade so the menu and the key read over the sky and grass */}
          <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(9,32,26,.72),rgba(9,32,26,0))]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(9,32,26,.7),rgba(9,32,26,0))]" />
        </div>

        <header className="flex h-20 items-center justify-between gap-4 px-4 sm:px-[clamp(24px,5vw,72px)]">
          <Link to="/" className="text-[22px] text-white"><BrandLogo /></Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
            <a href="#how" className="hidden px-3 py-2 text-white/90 transition-opacity hover:opacity-60 md:block">How it works</a>
            <a href="#facts" className="hidden px-3 py-2 text-white/90 transition-opacity hover:opacity-60 md:block">Price</a>
            <a href="#questions" className="hidden px-3 py-2 text-white/90 transition-opacity hover:opacity-60 md:block">Questions</a>
            <Link to="/login" className="px-3 py-2 text-white/90 transition-opacity hover:opacity-60">Log in</Link>
            <Link to="/signup" className="ml-1 inline-flex h-10 items-center rounded-[3px] border border-white/45 px-4 font-medium text-white transition-colors duration-150 hover:bg-white hover:text-shell">
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create a free account</span>
            </Link>
          </nav>
        </header>

        <section className="m-stage flex flex-1 flex-col px-4 pb-10 pt-6 sm:px-[clamp(24px,6vw,90px)] lg:justify-center lg:pb-24">
          <h1 className="m-pop max-w-[11ch] text-[clamp(44px,6vw,84px)] font-normal leading-[0.98] tracking-[-0.035em] [text-shadow:0_1px_24px_rgba(9,32,26,.25)]">
            Stop chasing. Start collecting.
          </h1>
          <p className="m-pop mt-5 max-w-[30ch] text-[17px] leading-relaxed text-white/85 sm:text-[19px]" style={{ '--d': '80ms' } as CSSProperties}>
            Rent and loans in Jamaica, tracked and chased for you.
          </p>
          <div className="m-pop mt-8 flex flex-wrap gap-3" style={{ '--d': '160ms' } as CSSProperties}>
            <Link to="/signup" className="inline-flex h-12 items-center rounded-[3px] bg-white px-5 text-[15px] font-medium text-shell transition-transform duration-150 hover:-translate-y-0.5">Create a free account</Link>
            <a href="#today" className="inline-flex h-12 items-center rounded-[3px] border border-white/45 px-5 text-[15px] text-white transition-colors duration-150 hover:bg-white/10">Try it below</a>
          </div>
          <LouvreLegend className="mt-auto pt-10 text-white lg:absolute lg:bottom-8 lg:right-[clamp(24px,5vw,72px)] lg:mt-0 lg:pt-0" />
        </section>
      </div>

      <main id="main">
        {/* The product itself, working, on the page */}
        <section aria-labelledby="today" className={cn(wrap, 'pb-16 pt-10 sm:pt-14 lg:pb-24')}>
          <h2 id="today" className="mb-6 text-[15px] font-medium">Your Today page. Press Mark paid and watch the building</h2>
          <LedgerDemo status={status} setStatus={setStatus} />
        </section>

        {/* Full width green band for how it works */}
        <section id="how" aria-labelledby="how-h" className="scroll-mt-4 bg-shell">
          <div className="m-stage px-5 pb-16 pt-16 text-white sm:px-[clamp(24px,6vw,90px)] lg:pb-24 lg:pt-24">
            <h2 id="how-h" className="m-pop max-w-[16ch] text-[clamp(32px,3.8vw,54px)] font-normal leading-[1.04] tracking-[-0.03em]">Rent, collected in three steps</h2>
            <div className="m-pop mt-12 text-ink [&_li>p]:text-white [&_li>p_span]:text-shell-ink" style={{ '--d': '120ms' } as CSSProperties}><RentFlow /></div>
          </div>
        </section>

        <section aria-labelledby="loan-h">
          <div className={cn(wrap, 'm-stage grid gap-8 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-11 lg:py-24')}>
            <h2 id="loan-h" className="m-pop max-w-[14ch] text-[clamp(32px,3.6vw,50px)] font-normal leading-[1.05] tracking-[-0.03em]">Loans, month by month</h2>
            <div className="m-pop" style={{ '--d': '120ms' } as CSSProperties}><LoanStrip /></div>
          </div>
        </section>

        {/* The tenant's side, back on the green */}
        <section aria-labelledby="tenant-h" className={onShell}>
          <div className={cn(wrap, 'grid items-center gap-12 py-16 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-24 lg:py-24')}>
            <div>
              <h2 id="tenant-h" className="m-pop max-w-[14ch] text-[clamp(32px,3.8vw,54px)] font-normal leading-[1.04] tracking-[-0.03em]">No account, no app, any phone</h2>
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
          <div className={cn(wrap, 'm-stage py-16 lg:py-24')}>
            <h2 id="else-h" className="m-pop text-[clamp(32px,3.6vw,50px)] font-normal leading-[1.05] tracking-[-0.03em]">And it keeps going without you</h2>
            <div className="m-pop mt-10" style={{ '--d': '120ms' } as CSSProperties}><FeatureShowcase /></div>
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
              <h2 id="q-h" className="m-pop text-[clamp(32px,3.6vw,50px)] font-normal leading-[1.05] tracking-[-0.03em]">Questions</h2>

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
        <div className={cn(wrap, 'm-stage py-16 lg:py-24')}>
          <p className="max-w-[16ch] text-[clamp(36px,4.4vw,60px)] font-normal leading-[1.02] tracking-[-0.035em]">Start with one tenant or one loan</p>
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
