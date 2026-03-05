import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronUp, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupStatus } from '@/hooks/useSetupStatus';

function ProgressRing({ percentage, size = 28 }: { percentage: number; size?: number }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage === 100 ? '#10b981' : percentage >= 50 ? '#3b82f6' : '#94a3b8';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export function SetupGuide() {
  const navigate = useNavigate();
  const {
    hasProperties, hasUnits, hasTenants,
    completedSteps, totalSteps, percentage,
    isComplete, isDismissed, loading, dismiss,
  } = useSetupStatus();
  const [open, setOpen] = useState(false);

  // Auto-dismiss after 3 seconds once all steps are complete
  useEffect(() => {
    if (isComplete && !isDismissed) {
      const timer = setTimeout(() => {
        dismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isDismissed, dismiss]);

  if (loading || isDismissed) return null;

  const steps = [
    {
      label: 'Add a Property',
      description: 'Create your first rental property',
      done: hasProperties,
      href: '/properties',
    },
    {
      label: 'Add Units',
      description: 'Add units to your property',
      done: hasUnits,
      href: '/properties',
    },
    {
      label: 'Add a Tenant',
      description: 'Assign a tenant to a unit',
      done: hasTenants,
      href: '/tenants',
    },
  ];

  const nextStep = steps.find(s => !s.done);

  const handleDismiss = async () => {
    setOpen(false);
    await dismiss();
  };

  const handleStepClick = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <>
      {/* Pill trigger */}
      {!open && (
        <div className="fixed bottom-16 right-5 z-30">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
          >
            <ProgressRing percentage={percentage} />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              Setup Guide
            </span>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {percentage}%
            </span>
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-16 right-5 z-40 w-80 bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
              <h3 className="text-base font-semibold text-slate-900">Setup Guide</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="px-5 pb-4 pt-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">
                  {isComplete
                    ? 'All set! You\'re ready to go.'
                    : `${completedSteps} of ${totalSteps} complete`}
                </p>
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  percentage === 100 ? "text-emerald-600" : "text-blue-600"
                )}>
                  {percentage}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    percentage === 100 ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="px-3 pb-3 space-y-0.5">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={step.done ? undefined : () => handleStepClick(step.href)}
                  disabled={step.done}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200",
                    step.done
                      ? "opacity-50 cursor-default"
                      : "hover:bg-slate-50 cursor-pointer group"
                  )}
                >
                  {step.done ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 group-hover:border-blue-400 transition-colors" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm block",
                      step.done ? "text-slate-400 line-through" : "text-slate-800 font-medium"
                    )}>
                      {step.label}
                    </span>
                    {!step.done && (
                      <span className="text-[11px] text-slate-400">{step.description}</span>
                    )}
                  </div>
                  {!step.done && (
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
              <button
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Dismiss guide
              </button>
              {nextStep && (
                <button
                  onClick={() => handleStepClick(nextStep.href)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                >
                  Next step
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
