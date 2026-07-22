import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { applicantScreeningService, type ApplicantScreening } from '@/lib/serviceProxy';

export function useScreeningData() {
  const { currentOrg } = useOrg();
  const [screenings, setScreenings] = useState<ApplicantScreening[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await applicantScreeningService.getAll();
      setScreenings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screenings');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { screenings, loading, error, refresh };
}
