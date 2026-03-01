import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Check, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { AddPropertyModal } from '@/components/AddPropertyModal';

const DISMISS_KEY = 'easycollect_setup_dismissed';

export function SetupGuide() {
  const navigate = useNavigate();
  const { hasProperties, hasUnits, hasTenants, completedSteps, totalSteps, isComplete, loading, refetch } = useSetupStatus();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (isComplete && !dismissed) {
      localStorage.setItem(DISMISS_KEY, 'true');
      setDismissed(true);
    }
  }, [isComplete, dismissed]);

  if (loading || dismissed) return null;

  const steps = [
    {
      label: 'Add a Property',
      done: hasProperties,
      action: () => { setOpen(false); setModalOpen(true); },
    },
    {
      label: 'Add Units',
      done: hasUnits,
      action: () => { setOpen(false); navigate('/settings?section=properties'); },
    },
    {
      label: 'Add first Tenant',
      done: hasTenants,
      action: () => { setOpen(false); navigate('/tenants'); },
    },
  ];

  return (
    <>
      {/* Floating trigger button — positioned above AiChat */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
        )}
      >
        <ClipboardList className="h-5 w-5" />
        {completedSteps < totalSteps && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
            {completedSteps}/{totalSteps}
          </span>
        )}
      </button>

      {/* Popover panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-34 right-4 left-4 sm:left-auto z-40 sm:w-72 bg-white rounded-xl border border-slate-200/60 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60">
              <h3 className="text-sm font-semibold text-slate-900">Setup Guide</h3>
              <button
                onClick={() => { setDismissed(true); localStorage.setItem(DISMISS_KEY, 'true'); setOpen(false); }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={step.done ? undefined : step.action}
                  disabled={step.done}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    step.done
                      ? "opacity-60"
                      : "hover:bg-white/60 cursor-pointer"
                  )}
                >
                  {step.done ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm flex-1",
                    step.done ? "text-slate-400 line-through" : "text-slate-700 font-medium"
                  )}>
                    {step.label}
                  </span>
                  {!step.done && (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                      Start <ChevronRight className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <AddPropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </>
  );
}
