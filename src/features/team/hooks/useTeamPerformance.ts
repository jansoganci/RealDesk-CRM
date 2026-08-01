import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../config/supabase';
import { useOrg } from '../../../contexts/OrgContext';
import type { TeamPerformanceData, PeriodFilter } from '../types/team.types';

/**
 * Team Performance Data Fetching Hook
 * Fetches team performance metrics for organization owners
 */

interface UseTeamPerformanceReturn {
  data: TeamPerformanceData | null;
  loading: boolean;
  error: string | null;
  periodFilter: PeriodFilter;
  setPeriodFilter: (period: PeriodFilter) => void;
  refetch: () => Promise<void>;
}

/**
 * Calculate date range based on period filter
 */
function getDateRange(period: PeriodFilter): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (period) {
    case 'thisMonth': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today,
      };
    }
    case 'lastMonth': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0],
      };
    }
    case 'thisQuarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return {
        startDate: startOfQuarter.toISOString().split('T')[0],
        endDate: today,
      };
    }
    case 'thisYear': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: today,
      };
    }
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: today,
      };
  }
}

export function useTeamPerformance(): UseTeamPerformanceReturn {
  const { t } = useTranslation('team');
  const { currentOrg, isOwner, loading: orgLoading } = useOrg();

  const [data, setData] = useState<TeamPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('thisMonth');

  const dateRange = useMemo(() => getDateRange(periodFilter), [periodFilter]);

  const fetchPerformance = useCallback(async () => {
    // Wait for org to load
    if (orgLoading) return;

    // Check if user has access
    if (!currentOrg?.id) {
      setError('No organization found');
      setLoading(false);
      return;
    }

    if (!isOwner) {
      setError('Access denied: Owner role required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: result, error: rpcError } = await supabase.rpc(
        'get_team_performance',
        {
          p_org_id: currentOrg.id,
          p_start_date: dateRange.startDate,
          p_end_date: dateRange.endDate,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setData(result as unknown as TeamPerformanceData);
    } catch (err) {
      console.error('Failed to load team performance:', err);
      setError('Failed to load team performance data');
      toast.error(t('errors.loadFailed'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, isOwner, orgLoading, dateRange, t]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    data,
    loading: loading || orgLoading,
    error,
    periodFilter,
    setPeriodFilter,
    refetch: fetchPerformance,
  };
}
