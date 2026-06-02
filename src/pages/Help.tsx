import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';

type Faq = { q: string; a: React.ReactNode };
type Section = { title: string; items: Faq[] };

const SECTIONS: Section[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'What’s the quickest way to get set up?',
        a: (
          <>For rent: add a <Link className="text-blue-600 hover:underline" to="/properties">Property</Link> and its units, add <Link className="text-blue-600 hover:underline" to="/tenants">Tenants</Link>, then create <Link className="text-blue-600 hover:underline" to="/invoices">Invoices</Link>. For lending: add a <Link className="text-blue-600 hover:underline" to="/borrowers">Borrower</Link>, then create a <Link className="text-blue-600 hover:underline" to="/loans">Loan</Link>. The Setup Guide (bottom-right) tracks your progress.</>
        ),
      },
      {
        q: 'Where do I add my bank details and company info?',
        a: <>In <Link className="text-blue-600 hover:underline" to="/settings">Settings</Link> — Company, Bank Details, and Notification preferences all live there. Your bank details appear on tenant payment pages.</>,
      },
    ],
  },
  {
    title: 'Borrowers & loans',
    items: [
      {
        q: 'After I add a borrower, what’s next?',
        a: <>Lend to them. On the <Link className="text-blue-600 hover:underline" to="/borrowers">Borrowers</Link> list, click <strong>New Loan</strong> on their row (the borrower is pre-selected), or click their name to open their profile and start a loan there. Then set the principal, interest rate, term and start date, and Create.</>,
      },
      {
        q: 'How is the monthly installment calculated?',
        a: <>Simple interest. Total repayable = principal × (1 + rate% × term÷12), and the monthly installment is that total divided by the term (the final installment absorbs any rounding). Example: J$100,000 at 10% for 12 months → J$110,000 total → about J$9,167/month.</>,
      },
      {
        q: 'How do I record a loan payment?',
        a: <>Expand the loan and click <strong>Record Payment</strong>. The payment is applied to the oldest unpaid installments first — a lump sum can clear several at once, and an underpayment leaves the next installment open rather than marking it paid. When every installment is covered, the loan automatically becomes <strong>Paid Off</strong>.</>,
      },
      {
        q: 'What does marking a loan as Defaulted do?',
        a: <>It flags the loan as non-performing. The loan moves to the <strong>Defaulted</strong> tab, drops out of your <strong>Active Loans</strong> count, and its Record Payment / Edit / Mark Defaulted actions are removed (only Delete remains). It does <strong>not</strong> delete the loan or change any balances — the principal, payments and schedule stay intact for your records, and it’s written to the Activity Log. Use it for loans you’ve stopped expecting repayment on.</>,
      },
      {
        q: 'What does "Paid Off" mean?',
        a: <>Every installment on the loan has been fully paid. The app sets this automatically once your recorded payments cover the whole schedule — you don’t need to mark it manually.</>,
      },
      {
        q: 'What counts as "Overdue"?',
        a: <>Any installment past its due date that isn’t paid. A daily check flips past-due installments to Overdue, raises the Overdue figure on the Loans dashboard, and creates a notification so you know to follow up.</>,
      },
      {
        q: 'Can I edit a loan after creating it?',
        a: <>Yes — until the first payment is recorded. Before any payments, editing the principal/rate/term rebuilds the installment schedule. Once a payment exists, the terms are locked (to keep the schedule consistent) and only the notes can be changed.</>,
      },
      {
        q: 'What happens when I delete a loan or a borrower?',
        a: <>Deleting a loan permanently removes it along with its schedule and payment history. Deleting a borrower also removes all of their loans. These can’t be undone, so each asks for confirmation first.</>,
      },
      {
        q: 'Can borrowers pay their loans online?',
        a: <>Not yet — loan payments are recorded manually for now (cash, bank transfer, card). Online loan payments and a borrower self-service link are on the roadmap. Rent invoices already support online payment.</>,
      },
    ],
  },
  {
    title: 'Rent, invoices & payments',
    items: [
      {
        q: 'How do I bill all my tenants at once?',
        a: <>On the <Link className="text-blue-600 hover:underline" to="/invoices">Invoices</Link> page use <strong>Invoice All Tenants</strong> to generate this period’s invoices in one go. You can also turn on recurring invoices in Settings to have them created automatically each month.</>,
      },
      {
        q: 'How do tenants pay, and what are payment proofs?',
        a: <>Tenants can pay online (card) via their payment link, or pay offline and upload a proof of payment, which you review and approve. Approving a proof records the payment and can send a receipt.</>,
      },
      {
        q: 'How do late fees work?',
        a: <>In Settings → Late Fees you set a flat or percentage fee, a grace period, and whether to apply it automatically. A daily job then adds the fee to overdue rent invoices. (Late fees currently apply to rent, not loans.)</>,
      },
    ],
  },
  {
    title: 'Notifications & account',
    items: [
      {
        q: 'Where do I see what’s happened recently?',
        a: <>The <Link className="text-blue-600 hover:underline" to="/notifications">Notifications</Link> bell covers payments, overdue items and approvals; the <Link className="text-blue-600 hover:underline" to="/activity-log">Activity Log</Link> is a full audit trail of every create/update/delete.</>,
      },
      {
        q: 'How do I change my password or notification preferences?',
        a: <>Both are in <Link className="text-blue-600 hover:underline" to="/settings">Settings</Link> — Security for your password, and Notifications to toggle which alerts and reminder emails you receive.</>,
      },
    ],
  },
];

function FaqRow({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-900">{item.q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1 text-sm text-slate-600 leading-relaxed">{item.a}</div>
      )}
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const sections = SECTIONS
    .map(s => ({
      ...s,
      items: q
        ? s.items.filter(i => i.q.toLowerCase().includes(q))
        : s.items,
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title="Help & FAQ" description="Answers to common questions about EasyCollect" />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search questions..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No questions match “{query}”.</p>
      ) : (
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map(item => <FaqRow key={item.q} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
