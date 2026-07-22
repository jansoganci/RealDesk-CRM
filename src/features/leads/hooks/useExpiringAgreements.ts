import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { BuyerAgentAgreement } from '@/services/leads.service';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useExpiringAgreements(daysThreshold: number = 30) {
  const { currentOrg } = useOrg();
  const [agreements, setAgreements] = useState<BuyerAgentAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await leadsService.getExpiringAgreements(currentOrg.id, daysThreshold);
      setAgreements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expiring agreements');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, daysThreshold]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentOrg?.id, refresh]);

  return { agreements, loading, error, refresh };
}
