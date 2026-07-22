import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { supabase } from '@/config/supabase';
import type { TeamPerformanceSummary } from '@/features/team/types/team.types';

function getThisMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

export function useTeamPerformanceSummary() {
  const { currentOrg, isOwner, loading: orgLoading } = useOrg();
  const [data, setData] = useState<TeamPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (orgLoading) return;
    if (!currentOrg?.id || !isOwner) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getThisMonthRange();
      const { data: result, error: rpcError } = await supabase.rpc(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- get_team_performance predates generated Supabase RPC types (see useTeamPerformance.ts)
        'get_team_performance' as any,
        { p_org_id: currentOrg.id, p_start_date: startDate, p_end_date: endDate }
      );
      if (rpcError) throw rpcError;
      setData((result as { summary: TeamPerformanceSummary }).summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team performance');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, isOwner, orgLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading: loading || orgLoading, error, refresh };
}
