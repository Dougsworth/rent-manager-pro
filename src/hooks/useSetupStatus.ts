import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties } from '@/services/properties';
import { getTenants } from '@/services/tenants';

interface SetupStatus {
  hasProperties: boolean;
  hasUnits: boolean;
  hasTenants: boolean;
  completedSteps: number;
  totalSteps: 3;
  isComplete: boolean;
  loading: boolean;
  refetch: () => void;
}

export function useSetupStatus(): SetupStatus {
  const { user } = useAuth();
  const [hasProperties, setHasProperties] = useState(false);
  const [hasUnits, setHasUnits] = useState(false);
  const [hasTenants, setHasTenants] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [properties, tenants] = await Promise.all([
        getProperties(user.id),
        getTenants(user.id),
      ]);
      setHasProperties(properties.length > 0);
      setHasUnits(properties.some(p => (p.units ?? []).length > 0));
      setHasTenants(tenants.length > 0);
    } catch (err) {
      console.error('Failed to load setup status:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const completedSteps = [hasProperties, hasUnits, hasTenants].filter(Boolean).length;

  return {
    hasProperties,
    hasUnits,
    hasTenants,
    completedSteps,
    totalSteps: 3,
    isComplete: completedSteps === 3,
    loading,
    refetch: fetch,
  };
}
