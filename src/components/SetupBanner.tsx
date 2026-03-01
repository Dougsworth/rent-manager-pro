import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupStatus } from '@/hooks/useSetupStatus';

export function SetupBanner() {
  const navigate = useNavigate();
  const { completedSteps, totalSteps, isComplete, isDismissed, loading, dismiss } = useSetupStatus();

  if (loading || isComplete || isDismissed) return null;

  const nextAction = completedSteps === 0
    ? 'add a property to get started.'
    : completedSteps === 1
    ? 'add units to your property.'
    : 'add your first tenant.';

  const nextHref = completedSteps < 2 ? '/properties' : '/tenants';

  return (
    <div className="mb-6 bg-white rounded-2xl border border-slate-200/60 p-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="h-5 w-5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">Complete your setup</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {completedSteps} of {totalSteps} steps complete — {nextAction}
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => navigate(nextHref)}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
