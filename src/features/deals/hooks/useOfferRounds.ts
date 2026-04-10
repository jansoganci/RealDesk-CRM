import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { offerRoundsService } from '@/lib/serviceProxy';
import type { OfferRound } from '@/types';

export function useOfferRounds(dealId: string | undefined) {
  const { currentOrg } = useOrg();
  const [rounds, setRounds] = useState<OfferRound[]>([]);
  const [activeRound, setActiveRound] = useState<OfferRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id || !dealId) {
      setRounds([]);
      setActiveRound(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [list, active] = await Promise.all([
        offerRoundsService.getByDeal(dealId),
        offerRoundsService.getActiveRound(dealId),
      ]);
      setRounds(list);
      setActiveRound(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load offer rounds');
      setRounds([]);
      setActiveRound(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rounds, activeRound, loading, error, refresh };
}
