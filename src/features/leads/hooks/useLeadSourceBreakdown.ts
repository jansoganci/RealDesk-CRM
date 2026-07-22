import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { LeadSource } from '@/services/leads.service';

export interface SourceBreakdownItem {
  source: LeadSource;
  count: number;
  percentage: number;
}

export function useLeadSourceBreakdown() {
  const { currentOrg } = useOrg();
  const [data, setData] = useState<SourceBreakdownItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setData([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const raw = await leadsService.getSourceBreakdown(currentOrg.id);
      const totalCount = raw.reduce((sum, item) => sum + item.count, 0);
      const enriched: SourceBreakdownItem[] = raw.map((item) => ({
        source: item.source,
        count: item.count,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }));
      setData(enriched);
      setTotal(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load source breakdown');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, total, loading, error, refresh };
}
