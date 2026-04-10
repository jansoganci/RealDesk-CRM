import { useCallback, useEffect, useState } from 'react';
import { leadsService } from '@/lib/serviceProxy';
import type { LeadWithRelations } from '@/services/leads.service';

export function useLeadDetail(leadId?: string) {
  const [detail, setDetail] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!leadId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await leadsService.getLeadWithDetails(leadId);
      setDetail(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lead detail';
      setError(message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    detail,
    loading,
    error,
    refresh,
    setDetail,
  };
}
