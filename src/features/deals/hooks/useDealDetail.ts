import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { dealsService, type DealWithRelations } from '@/lib/serviceProxy';

export function useDealDetail(dealId: string | undefined) {
  const { currentOrg } = useOrg();
  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id || !dealId) {
      setDeal(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await dealsService.getById(dealId);
      setDeal(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deal');
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { deal, loading, error, refresh };
}
