import { useState } from 'react';
import { Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { AddPropertyModal } from '@/components/AddPropertyModal';

export function SetupBanner() {
  const { completedSteps, totalSteps, isComplete, loading, refetch } = useSetupStatus();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading || isComplete || dismissed) return null;

  return (
    <>
      <div className="mb-6 bg-white rounded-2xl border border-blue-200/60 p-5 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Rocket className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Complete your setup</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {completedSteps} of {totalSteps} steps complete — add a property to get started.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setModalOpen(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      <AddPropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </>
  );
}
