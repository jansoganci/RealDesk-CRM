import { useCallback, useEffect, useRef, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import {
  dashboardExperienceService,
  userPreferencesService,
} from '@/lib/serviceProxy';
import {
  resolveDashboardExperience,
  type DashboardExperience,
} from '../utils/dashboardExperience';

interface UseDashboardExperienceReturn {
  experience: DashboardExperience;
  loading: boolean;
  error: string | null;
  markWelcomeSeen: () => Promise<void>;
}

export function useDashboardExperience(): UseDashboardExperienceReturn {
  const { currentOrg } = useOrg();
  const [experience, setExperience] = useState<DashboardExperience>('daily_brief');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadExperience = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!currentOrg?.id) {
      setExperience('daily_brief');
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [presence, welcomeSeenAt] = await Promise.all([
        dashboardExperienceService.getDataPresence(),
        userPreferencesService.getDashboardWelcomeSeenAt(),
      ]);

      if (requestId !== requestIdRef.current) return;

      setExperience(
        resolveDashboardExperience({
          propertyCount: presence.hasProperties ? 1 : 0,
          leadCount: presence.hasLeads ? 1 : 0,
          welcomeSeenAt,
        })
      );
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;

      setExperience('daily_brief');
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to determine dashboard experience'
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void loadExperience();
  }, [loadExperience]);

  const markWelcomeSeen = useCallback(async () => {
    await userPreferencesService.markDashboardWelcomeSeen();
    setExperience('empty_workspace');
  }, []);

  return {
    experience,
    loading,
    error,
    markWelcomeSeen,
  };
}
