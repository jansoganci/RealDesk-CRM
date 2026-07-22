import { useEffect, useState } from 'react';
import { leadsService } from '@/lib/serviceProxy';
import type { InquiryMatchWithProperty } from '@/types';

interface MatchesState {
  leadId: string | null;
  matches: InquiryMatchWithProperty[];
  loading: boolean;
  error: Error | null;
}

const INITIAL_STATE: MatchesState = {
  leadId: null,
  matches: [],
  loading: false,
  error: null,
};

export function useLeadPropertyMatches(leadId: string | undefined, enabled: boolean) {
  const [state, setState] = useState<MatchesState>(INITIAL_STATE);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!leadId || !enabled) {
      setState(INITIAL_STATE);
      return () => {
        cancelled = true;
      };
    }

    setState({ leadId, matches: [], loading: true, error: null });
    void leadsService
      .getMatchesByInquiry(leadId)
      .then((matches) => {
        if (!cancelled) setState({ leadId, matches, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            leadId,
            matches: [],
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to load property matches'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, leadId, reloadKey]);

  const currentState = state.leadId === leadId ? state : INITIAL_STATE;
  return {
    ...currentState,
    reload: () => setReloadKey((key) => key + 1),
  };
}
