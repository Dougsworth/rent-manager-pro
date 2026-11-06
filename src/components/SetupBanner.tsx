import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSetupStatus } from '@/hooks/useSetupStatus';

/** One line: how far setup is, and the next thing to do. */
export function SetupBanner() {
  const navigate = useNavigate();
  const { completedSteps, totalSteps, isComplete, isDismissed, loading, dismiss } = useSetupStatus();

  if (loading || isComplete || isDismissed) return null;

  const next = completedSteps === 0
    ? { text: 'Next, add a property.', action: 'Add a property', href: '/properties' }
    : completedSteps === 1
    ? { text: 'Next, add units to your property.', action: 'Add units', href: '/properties' }
    : { text: 'Next, add your first tenant.', action: 'Add a tenant', href: '/tenants' };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule py-3">
      <p className="min-w-0 flex-1 text-[15px]">
        <span className="num font-semibold">{completedSteps} of {totalSteps}</span> setup steps done. {next.text}
      </p>
      <div className="flex items-center gap-4">
        <Button size="sm" onClick={() => navigate(next.href)}>{next.action}</Button>
        <button type="button" onClick={dismiss} className="min-h-9 cursor-pointer text-sm text-quiet underline hover:text-ink">Hide</button>
      </div>
    </div>
  );
}
