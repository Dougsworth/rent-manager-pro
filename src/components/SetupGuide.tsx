import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { getLoans } from '@/services/loans';
import { cn } from '@/lib/utils';

/**
 * A quiet onboarding checklist. A small text button opens it as a popover.
 * It sits above the phone tab bar and to the right of the desktop rail.
 */
export function SetupGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    hasProperties, hasUnits, hasTenants,
    completedSteps, totalSteps,
    isComplete, isDismissed, loading, dismiss,
  } = useSetupStatus();
  const [open, setOpen] = useState(false);
  const [hasLoan, setHasLoan] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss after 3 seconds once all steps are complete
  useEffect(() => {
    if (isComplete && !isDismissed) {
      const timer = setTimeout(() => {
        dismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isDismissed, dismiss]);

  // The loan step is optional, so only look it up when the list is opened
  useEffect(() => {
    if (!open || !user || hasLoan !== null) return;
    getLoans(user.id).then((l) => setHasLoan(l.length > 0)).catch(() => setHasLoan(false));
  }, [open, user, hasLoan]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (loading || isDismissed) return null;

  const steps = [
    { label: 'Add a property', done: hasProperties, href: '/properties' },
    { label: 'Add units', done: hasUnits, href: '/properties' },
    { label: 'Add a tenant', done: hasTenants, href: '/tenants' },
  ];

  const handleDismiss = async () => {
    setOpen(false);
    await dismiss();
  };

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const position = 'fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 sm:left-8 lg:bottom-6 lg:left-[calc(216px+44px)]';

  const row = (label: string, done: boolean, href: string, note?: string) => (
    <li key={label} className="border-t border-rule">
      {done ? (
        <div className="flex min-h-11 items-center gap-3 py-2 text-[15px] text-quiet">
          <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-paid" strokeWidth={2.5} />
          <span>{label}</span>
          <span className="sr-only">, done</span>
        </div>
      ) : (
        <button type="button" onClick={() => go(href)} className="flex min-h-11 w-full cursor-pointer items-center gap-3 py-2 text-left text-[15px] text-ink hover:underline">
          <span aria-hidden="true" className="h-4 w-4 shrink-0 border border-input" />
          <span>{label}</span>
          {note && <span className="text-[13.5px] text-quiet">{note}</span>}
        </button>
      )}
    </li>
  );

  return (
    <>
      {!open && !isComplete && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(position, 'z-30 flex h-10 cursor-pointer items-center gap-2 rounded-[3px] border border-input bg-popover px-3 text-sm font-semibold text-shell transition-colors duration-100 hover:bg-secondary')}
        >
          Finish setup
          <span className="num font-normal text-quiet">{completedSteps} of {totalSteps}</span>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Setup checklist"
            className={cn(position, 'z-50 w-[300px] max-w-[calc(100vw-32px)] border border-rule bg-popover px-4 pb-3 pt-3 text-ink shadow-lg')}
          >
            <div className="flex items-start justify-between gap-3 pb-2">
              <div>
                <h2 className="text-[15px] font-semibold">{isComplete ? 'You are set up' : 'Get set up'}</h2>
                <p className="num text-[13.5px] text-quiet">{completedSteps} of {totalSteps} done</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-quiet hover:bg-secondary hover:text-ink"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <ul>
              {steps.map((s) => row(s.label, s.done, s.href))}
              {row('Add a loan', hasLoan === true, '/loans', 'if you lend money')}
            </ul>
            <div className="border-t border-rule pt-2">
              <button type="button" onClick={handleDismiss} className="min-h-10 cursor-pointer text-sm text-quiet underline hover:text-ink">
                Hide this checklist
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
