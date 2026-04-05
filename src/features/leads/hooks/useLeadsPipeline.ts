import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { Lead, LeadStatus } from '@/services/leads.service';

export type LeadPipeline = Record<LeadStatus, Lead[]>;

export function useLeadsPipeline() {
  const { currentOrg } = useOrg();
  const [pipeline, setPipeline] = useState<LeadPipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setPipeline(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await leadsService.getLeadsPipeline(currentOrg.id);
      setPipeline(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pipeline');
      setPipeline(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { pipeline, loading, error, refresh };
}
