import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { updateMilestoneDueDate } from '@/lib/serviceProxy';
import { getActiveOrgId } from '@/lib/orgHelpers';
import type { DealAmendment, DealMilestone } from '@/types';

type CreateAmendmentInput = {
  amendmentType: string;
  description: string;
  effectiveDate: string;
  oldValue?: string | null;
  newValue?: string | null;
  milestoneId?: string | null;
  milestoneDueDate?: string | null;
};

export function useAmendmentsTab(dealId: string | undefined) {
  const [amendments, setAmendments] = useState<DealAmendment[]>([]);
  const [milestones, setMilestones] = useState<DealMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!dealId) {
      setAmendments([]);
      setMilestones([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [amendmentsRes, milestonesRes] = await Promise.all([
        supabase
          .from('deal_amendments')
          .select('*')
          .eq('deal_id', dealId)
          .order('effective_date', { ascending: false }),
        supabase
          .from('deal_milestones')
          .select('*')
          .eq('deal_id', dealId)
          .order('due_date', { ascending: true }),
      ]);

      if (amendmentsRes.error) throw amendmentsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      setAmendments((amendmentsRes.data ?? []) as DealAmendment[]);
      setMilestones((milestonesRes.data ?? []) as DealMilestone[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load amendments');
      setAmendments([]);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createAmendment = useCallback(
    async (input: CreateAmendmentInput) => {
      if (!dealId) throw new Error('Deal id is required');
      const orgId = await getActiveOrgId();

      const { error: insertError } = await supabase.from('deal_amendments').insert({
        org_id: orgId,
        deal_id: dealId,
        amendment_type: input.amendmentType,
        description: input.description,
        effective_date: input.effectiveDate,
        old_value: input.oldValue ?? null,
        new_value: input.newValue ?? null,
      });
      if (insertError) throw insertError;

      if (
        input.amendmentType === 'deadline_extension' &&
        input.milestoneId &&
        input.milestoneDueDate
      ) {
        await updateMilestoneDueDate(input.milestoneId, input.milestoneDueDate);
      }

      await refresh();
    },
    [dealId, refresh]
  );

  return {
    amendments,
    milestones,
    loading,
    error,
    refresh,
    createAmendment,
  };
}
