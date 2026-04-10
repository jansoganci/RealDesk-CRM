import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { dealsService, type DealStats } from '@/lib/serviceProxy';
import type { Deal } from '@/types';

export function useDeals() {
  const { currentOrg } = useOrg();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setDeals([]);
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [list, dealStats] = await Promise.all([dealsService.getAll(), dealsService.getStats()]);
      setDeals(list);
      setStats(dealStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deals');
      setDeals([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { deals, stats, loading, error, refresh };
}
