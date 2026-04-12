import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/config/supabase';
import { leaseAgreementService } from '@/lib/serviceProxy';
import type { Contract, LeaseAmendment, LeaseDetails } from '@/types';

type ContractWithRelations = Contract & {
  tenant?: { id: string; name: string; email: string | null; phone: string | null } | null;
  property?: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    property_type: string | null;
    year_built: number | null;
  } | null;
};

export type UseLeaseDetailsResult = {
  leaseDetails: LeaseDetails | null;
  contract: ContractWithRelations | null;
  amendments: LeaseAmendment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLeaseDetails(contractId: string | undefined): UseLeaseDetailsResult {
  const [leaseDetails, setLeaseDetails] = useState<LeaseDetails | null>(null);
  const [contract, setContract] = useState<ContractWithRelations | null>(null);
  const [amendments, setAmendments] = useState<LeaseAmendment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contractId) {
      setError('Missing contract id');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [{ data: contractRow, error: contractErr }, details, amendmentsList] = await Promise.all([
        supabase
          .from('contracts')
          .select(
            `
            *,
            tenant:tenants(id, name, email, phone),
            property:properties(id, address, city, state, zip_code, property_type, year_built)
            `,
          )
          .eq('id', contractId)
          .is('deleted_at', null)
          .maybeSingle(),
        leaseAgreementService.getLeaseDetails(contractId),
        leaseAgreementService.getAmendments(contractId),
      ]);

      if (contractErr) throw contractErr;
      if (!contractRow) throw new Error('Contract not found');

      setContract(contractRow as ContractWithRelations);
      setLeaseDetails(details);
      setAmendments(amendmentsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lease details');
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    leaseDetails,
    contract,
    amendments,
    isLoading,
    error,
    refresh,
  };
}
