import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { depositTrackerService, type SecurityDeposit } from '@/lib/serviceProxy';

export function useDepositTracker() {
  const { currentOrg } = useOrg();
  const [deposits, setDeposits] = useState<SecurityDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await depositTrackerService.getAll();
      setDeposits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { deposits, loading, error, refresh };
}
