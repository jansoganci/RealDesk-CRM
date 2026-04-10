import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { dailyBriefService } from '@/lib/serviceProxy';
import type { DailyBriefData } from '@/types';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const EMPTY_DAILY_BRIEF: DailyBriefData = {
  overdue: [],
  dueToday: [],
  due3Days: [],
  due7Days: [],
  waitingOnOthers: [],
  dealHealthCards: [],
};

export function useDailyBrief() {
  const { currentOrg } = useOrg();
  const [data, setData] = useState<DailyBriefData>(EMPTY_DAILY_BRIEF);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setData(EMPTY_DAILY_BRIEF);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await dailyBriefService.getDailyBriefData();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Daily Brief');
      setData(EMPTY_DAILY_BRIEF);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    const timer = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentOrg?.id, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
