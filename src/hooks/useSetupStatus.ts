import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getProperties } from '@/services/properties';
import { getTenants } from '@/services/tenants';

interface SetupProgress {
  has_property: boolean;
  has_units: boolean;
  has_tenant: boolean;
  completed_at: string | null;
  dismissed: boolean;
}

interface SetupStatus {
  hasProperties: boolean;
  hasUnits: boolean;
  hasTenants: boolean;
  completedSteps: number;
  totalSteps: 3;
  percentage: number;
  isComplete: boolean;
  isDismissed: boolean;
  loading: boolean;
  refetch: () => void;
  dismiss: () => Promise<void>;
}

const DEFAULT_PROGRESS: SetupProgress = {
  has_property: false,
  has_units: false,
  has_tenant: false,
  completed_at: null,
  dismissed: false,
};

export function useSetupStatus(): SetupStatus {
  const { user } = useAuth();
  const [progress, setProgress] = useState<SetupProgress>(DEFAULT_PROGRESS);
  const [loading, setLoading] = useState(true);
  const prevProgressRef = useRef<string>('');

  const saveProgress = useCallback(async (newProgress: SetupProgress) => {
    if (!user) return;
    // Only write to DB if something actually changed
    const key = JSON.stringify(newProgress);
    if (key === prevProgressRef.current) return;
    prevProgressRef.current = key;

    await supabase
      .from('profiles')
      .update({ setup_progress: newProgress as any })
      .eq('id', user.id);
  }, [user]);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const [properties, tenants] = await Promise.all([
        getProperties(user.id),
        getTenants(user.id),
      ]);

      const hasProperty = properties.length > 0;
      const hasUnits = properties.some(p => (p.units ?? []).length > 0);
      const hasTenant = tenants.length > 0;
      const allDone = hasProperty && hasUnits && hasTenant;

      setProgress(prev => {
        const updated: SetupProgress = {
          ...prev,
          has_property: hasProperty,
          has_units: hasUnits,
          has_tenant: hasTenant,
          completed_at: allDone && !prev.completed_at ? new Date().toISOString() : prev.completed_at,
        };
        // Save to DB (async, fire-and-forget)
        saveProgress(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to check setup status:', err);
    } finally {
      setLoading(false);
    }
  }, [user, saveProgress]);

  // Initial load: read saved progress from profile, then verify against real data
  useEffect(() => {
    if (!user) return;

    const loadSaved = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('setup_progress')
        .eq('id', user.id)
        .single();

      const saved = (data as any)?.setup_progress as SetupProgress | null;
      if (saved) {
        setProgress(saved);
        prevProgressRef.current = JSON.stringify(saved);
        // If already dismissed, don't bother checking
        if (saved.dismissed) {
          setLoading(false);
          return;
        }
      }

      // Always verify against real data
      await checkStatus();
    };

    loadSaved();
  }, [user]);

  // Refetch when window regains focus (user comes back from Properties/Tenants page)
  useEffect(() => {
    if (!user || progress.dismissed) return;

    const onFocus = () => {
      checkStatus();
    };

    window.addEventListener('focus', onFocus);
    // Also listen for route changes via popstate
    window.addEventListener('popstate', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('popstate', onFocus);
    };
  }, [user, progress.dismissed, checkStatus]);

  // Periodic check every 5 seconds while guide is visible (catches in-app navigation)
  useEffect(() => {
    if (!user || progress.dismissed || progress.completed_at) return;

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [user, progress.dismissed, progress.completed_at, checkStatus]);

  const dismiss = useCallback(async () => {
    const updated = { ...progress, dismissed: true };
    setProgress(updated);
    await saveProgress(updated);
  }, [progress, saveProgress]);

  const completedSteps = [progress.has_property, progress.has_units, progress.has_tenant].filter(Boolean).length;
  const percentage = Math.round((completedSteps / 3) * 100);

  return {
    hasProperties: progress.has_property,
    hasUnits: progress.has_units,
    hasTenants: progress.has_tenant,
    completedSteps,
    totalSteps: 3,
    percentage,
    isComplete: completedSteps === 3,
    isDismissed: progress.dismissed,
    loading,
    refetch: checkStatus,
    dismiss,
  };
}
