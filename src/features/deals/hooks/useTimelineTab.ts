import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import {
  addCustomMilestone,
  addMilestoneNote,
  getByDeal,
  getMilestoneDocument,
  sendNudge,
  updateMilestoneDueDate,
  updateMilestoneStatus,
  uploadMilestoneDocument,
} from '@/lib/serviceProxy';
import type { DealMilestone, DealParty, MilestoneStatus } from '@/types';

type AddCustomMilestoneInput = {
  title: string;
  due_date: string;
  responsible_party?: DealMilestone['responsible_party'];
  notes?: string | null;
  document_required?: boolean;
};

export function useTimelineTab(dealId?: string) {
  const { currentOrg } = useOrg();
  const [milestones, setMilestones] = useState<DealMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!dealId || !currentOrg?.id) {
      setMilestones([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await getByDeal(dealId);
      setMilestones(rows as DealMilestone[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setStatus = useCallback(
    async (milestoneId: string, status: MilestoneStatus) => {
      const updated = await updateMilestoneStatus(milestoneId, status);
      setMilestones((prev) =>
        prev.map((row) => (row.id === milestoneId ? (updated as DealMilestone) : row))
      );
      return updated as DealMilestone;
    },
    []
  );

  const addNote = useCallback(async (milestoneId: string, note: string) => {
    const updated = await addMilestoneNote(milestoneId, note);
    setMilestones((prev) =>
      prev.map((row) => (row.id === milestoneId ? (updated as DealMilestone) : row))
    );
    return updated as DealMilestone;
  }, []);

  const uploadDocument = useCallback(async (milestoneId: string, file: File) => {
    const updated = await uploadMilestoneDocument(milestoneId, file);
    setMilestones((prev) =>
      prev.map((row) => (row.id === milestoneId ? (updated as DealMilestone) : row))
    );
    return updated as DealMilestone;
  }, []);

  const getDocumentUrl = useCallback(async (milestoneId: string) => {
    return getMilestoneDocument(milestoneId);
  }, []);

  const createCustomMilestone = useCallback(
    async (input: AddCustomMilestoneInput) => {
      if (!dealId) throw new Error('Deal id is required');
      const created = await addCustomMilestone(dealId, input);
      setMilestones((prev) =>
        [...prev, created as DealMilestone].sort((a, b) => a.due_date.localeCompare(b.due_date))
      );
      return created as DealMilestone;
    },
    [dealId]
  );

  const updateDueDate = useCallback(async (milestoneId: string, date: string) => {
    const updated = await updateMilestoneDueDate(milestoneId, date);
    setMilestones((prev) =>
      prev
        .map((row) => (row.id === milestoneId ? (updated as DealMilestone) : row))
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
    );
    return updated as DealMilestone;
  }, []);

  const nudge = useCallback(async (milestoneId: string): Promise<DealParty | null> => {
    const party = await sendNudge(milestoneId);
    setMilestones((prev) =>
      prev.map((row) =>
        row.id === milestoneId
          ? ({ ...row, last_nudge_sent_at: new Date().toISOString() } as DealMilestone)
          : row
      )
    );
    return party as DealParty | null;
  }, []);

  return {
    milestones,
    loading,
    error,
    refresh,
    setStatus,
    addNote,
    uploadDocument,
    getDocumentUrl,
    createCustomMilestone,
    updateDueDate,
    nudge,
  };
}
