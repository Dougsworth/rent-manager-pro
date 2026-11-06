import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SEO from '@/components/SEO';
import BrandLogo from '@/components/BrandLogo';
import { LedgerDemo } from '@/components/landing/LedgerDemo';
import { cn } from '@/lib/utils';

const wrap = 'mx-auto max-w-[1180px] px-4 sm:px-8 lg:px-11';

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

const rentSteps: [string, string][] = [
  ['Send an invoice or a pay link.', 'By email from EasyCollect, or copy the link into WhatsApp.'],
  ['Your tenant pays by bank transfer.', 'Then sends a screenshot of the confirmation through the same link.'],
  ['You approve it.', 'The payment is recorded and a receipt goes to the tenant.'],
];

const loanSteps: [string, string][] = [
  ['Add the borrower and the loan.', 'The amount, any interest, and how many months to repay.'],
  ['Get the schedule.', 'Each repayment is laid out with the date it is due.'],
  ['Record repayments as they come.', 'See what is left, what is next, and who has fallen behind.'],
];

const extras: [string, string][] = [
  ['Automatic reminders', 'Late tenants get an email with the amount, your bank details and their pay link. Off until you turn it on.'],
  ['Recurring invoices', 'Rent invoices are made on the same day each month, and emailed if you want.'],
  ['Late fees', 'A flat or percentage fee after a grace period you choose.'],
  ['Receipts', 'Every approved payment gets one you can print or save as a PDF.'],
  ['Reports', 'What came in, month by month, ready to export for your accountant.'],
  ['Calendar', 'Due dates and lease ends in one view.'],
];

const facts: [string, string][] = [
  ['We never hold your money.', 'Bank transfers go straight to your account. Card payments, if you turn them on, go through HandyPay.'],
  ['Your records are yours alone.', 'Stored in a Postgres database with row level security, so each account can only read its own people and payments.'],
  ['Encrypted connections.', 'Everything between your phone and EasyCollect goes over HTTPS. Passwords are never stored in plain text.'],
];

const faqs: [string, string][] = [
  ['Do my tenants need an account or an app?', 'No. They get a link, open it in the browser on any phone, see the amount and your bank details, and send their screenshot from there. You can email the link from EasyCollect or copy it into WhatsApp.'],
  ['How does proof of payment work?', 'After paying, the tenant uploads a screenshot of the bank confirmation through their link. You see it under Payments, check it against your account, then approve or reject it. Approving records the payment and emails the tenant a receipt.'],
  ['Can I track loans as well as rent?', 'Yes. Add a borrower, set the amount, interest and term, and EasyCollect lays out the repayment schedule. Record repayments as they come in and you always see what is left and what is late.'],
  ['How do reminders work?', 'Send one yourself to anyone who is late, with a few seconds to undo. Or turn on automatic reminders in Settings, and tenants with overdue invoices get an email with the amount, your bank details and their pay link.'],
  ['Can I manage more than one property?', 'Yes. Add each property with its units and tenants, and see all of them on one Today page.'],
  ['What happens when Pro arrives?', 'We will tell you what it costs before anything changes. Your records stay yours either way, and you can export them.'],
];

export default function Landing() {
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

        <section className={cn(wrap, 'pb-12 pt-12 sm:pb-16 sm:pt-20 lg:pt-24')}>
          <h1 className="display text-[44px] font-medium leading-[1.02] tracking-[-0.02em] sm:text-[64px] sm:tracking-[-0.03em] lg:text-[72px]">
            <span className="block">Know what's owed</span>
            <span className="block text-shell-ink">Know what to do</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[18px] leading-snug text-shell-ink sm:mt-8 sm:text-[20px]">
            Rent and personal loans in one list, for landlords and lenders in Jamaica. See who owes you, how much and how late, and chase it in one click.
          </p>
          <div className="mt-7 flex flex-col gap-x-5 gap-y-3 sm:flex-row sm:items-center">
            <Link to="/signup" className={onGreenPrimary}>Create a free account</Link>
            <p className="text-[14px] text-shell-ink">Free for now. Your tenants never need an account.</p>
          </div>
        </section>
      </div>

      <main id="main">
        {/* The product itself, working, on the page */}
        <section aria-labelledby="today" className={cn(wrap, 'pb-16 pt-10 sm:pt-14 lg:pb-24')}>
          <h2 id="today" className="mb-6 text-[15px] font-medium">This is the page you open every day</h2>
          <LedgerDemo />
        </section>

        <section id="how" aria-labelledby="how-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'py-16 lg:py-24')}>
            <h2 id="how-h" className="display max-w-[22ch] text-[34px] font-medium leading-[1.05] sm:text-[40px]">Built around how money moves here</h2>
            <p className="mt-3 max-w-[52ch] text-[17px] text-quiet">Bank transfers, screenshots and WhatsApp. EasyCollect keeps the record so you do not have to.</p>
            <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-11">
              {([['If you collect rent', rentSteps], ['If you lend money', loanSteps]] as const).map(([title, steps]) => (
                <div key={title}>
                  <h3 className="text-[19px] font-medium">{title}</h3>
                  <ol className="mt-3 border-b border-rule">
                    {steps.map(([lead, rest]) => (
                      <li key={lead} className="border-t border-rule py-4 text-[16px]">
                        <span className="font-medium">{lead}</span> <span className="text-quiet">{rest}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The tenant's side, back on the green */}
        <section aria-labelledby="tenant-h" className={onShell}>
          <div className={cn(wrap, 'grid items-center gap-12 py-16 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-24 lg:py-24')}>
            <div>
              <h2 id="tenant-h" className="display max-w-[14ch] text-[40px] font-medium leading-[1] sm:text-[48px]">No account, no app, any phone</h2>
              <p className="mt-5 max-w-[46ch] text-[17px] text-shell-ink">
                Your tenant opens the link and sees what they owe, when it was due and where to send it. They pay the way they always do, then send the screenshot from the same page.
              </p>
              <p className="mt-3 max-w-[46ch] text-[17px] text-shell-ink">
                Connect HandyPay and they can pay by card there too.
              </p>
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
            <h2 id="else-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">What else it does</h2>
            <dl className="mt-8 grid gap-x-11 sm:grid-cols-2 lg:grid-cols-3">
              {extras.map(([term, desc]) => (
                <div key={term} className="border-t border-rule py-4">
                  <dt className="font-medium">{term}</dt>
                  <dd className="mt-1 max-w-[40ch] text-[15px] text-quiet">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="facts" aria-labelledby="price-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'grid gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-11 lg:py-24')}>
            <div>
              <h2 id="price-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">Free for now</h2>
              <p className="mt-4 max-w-[40ch] text-[17px]">Every feature on this page is free to use today. No card, no trial clock.</p>
              <p className="mt-3 max-w-[40ch] text-[17px] text-quiet">A Pro plan will come later. You will hear what it costs before anything changes.</p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium">Where your money and records go</h3>
              <ul className="mt-3 border-b border-rule text-[16px]">
                {facts.map(([lead, rest]) => (
                  <li key={lead} className="border-t border-rule py-4">
                    <span className="font-medium">{lead}</span> <span className="text-quiet">{rest}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[14px] text-quiet">
                The <Link to="/privacy" className="text-shell underline underline-offset-[3px]">Privacy Policy</Link> has the rest.
              </p>
            </div>
          </div>
        </section>

        <section id="questions" aria-labelledby="q-h" className="scroll-mt-4 border-t border-rule">
          <div className={cn(wrap, 'grid gap-8 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-11 lg:py-24')}>
            <div>
              <h2 id="q-h" className="display text-[34px] font-medium leading-[1.05] sm:text-[40px]">Questions</h2>
              <p className="mt-3 text-[17px] text-quiet">
                Something else? Email <a href="mailto:support@easycollectja.com" className="text-shell underline underline-offset-[3px]">support@easycollectja.com</a>
              </p>
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
