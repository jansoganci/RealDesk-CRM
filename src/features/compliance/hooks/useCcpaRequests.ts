import { useCallback, useEffect, useState } from 'react';
import { ccpaService, type DataSubjectRequest } from '@/lib/serviceProxy';
import { useOrg } from '@/contexts/OrgContext';

export function useCcpaRequests() {
  const { currentOrg } = useOrg();
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ccpaService.getRequests(currentOrg.id);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { requests, loading, error, refresh };
}
